import { NextResponse } from 'next/server';
import { getPostById, updatePost, getToken } from '@/lib/db';
import { smartPublish } from '@/lib/n8n';
import { createFacebookTextPost, createFacebookImagePost } from '@/lib/platforms/facebook';
import { createInstagramImagePost } from '@/lib/platforms/instagram';
import path from 'path';

export async function POST(request) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status !== 'approved') {
      return NextResponse.json({ error: 'Post must be approved before publishing' }, { status: 400 });
    }

    // Gather token info
    const facebookToken = await getToken('facebook');
    const instagramToken = await getToken('instagram');

    // Resolve image URL — Pollinations URLs are already absolute, local paths need the app URL prefix
    const resolveImageUrl = (imgPath) => {
      if (!imgPath) return null;
      if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:')) return imgPath;
      return `${process.env.NEXT_PUBLIC_APP_URL}${imgPath}`;
    };

    // Try n8n first
    const n8nResult = await smartPublish({
      platform: post.platform,
      text: post.written_content,
      imageUrl: resolveImageUrl(post.image_path),
      imagePath: post.image_path && !post.image_path.startsWith('http') ? path.join(process.cwd(), 'public', post.image_path) : null,
      facebookToken: facebookToken?.access_token || null,
      fbPageId: facebookToken?.user_id || null,
      instagramToken: instagramToken?.access_token || null,
      igUserId: instagramToken?.user_id || null,
    });

    // If n8n handled it successfully
    if (n8nResult && !n8nResult.fallbackToDirect) {
      const hasSuccess = n8nResult.results?.facebook || n8nResult.results?.instagram;
      const newStatus = hasSuccess ? 'published' : 'failed';

      await updatePost(postId, {
        status: newStatus,
        facebook_post_id: n8nResult.results?.facebook?.postId || null,
        instagram_post_id: n8nResult.results?.instagram?.postId || null,
        published_at: hasSuccess ? new Date().toISOString() : null,
      });

      return NextResponse.json({
        success: hasSuccess,
        results: n8nResult.results,
        errors: n8nResult.errors?.length > 0 ? n8nResult.errors : undefined,
        via: 'n8n',
      });
    }

    // === FALLBACK: Direct API calls ===
    console.log('[publish] Falling back to direct API calls');
    const results = { facebook: null, instagram: null };
    const errors = [];

    // Parse platform-specific text if applicable
    let fbText = post.written_content;
    let igText = post.written_content;
    if (post.platform === 'both') {
      const fbMatch = post.written_content.match(/===\s*FACEBOOK\s*===([\s\S]*?)(?:===\s*INSTAGRAM\s*===|$)/i);
      const igMatch = post.written_content.match(/===\s*INSTAGRAM\s*===([\s\S]*?)(?:===\s*FACEBOOK\s*===|$)/i);
      if (fbMatch && fbMatch[1].trim()) fbText = fbMatch[1].trim();
      if (igMatch && igMatch[1].trim()) igText = igMatch[1].trim();
    }

    // Publish to Facebook
    if (post.platform === 'facebook' || post.platform === 'both') {
      if (facebookToken) {
        try {
          let result;
          if (post.image_path) {
            const imageUrl = resolveImageUrl(post.image_path);
            result = await createFacebookImagePost(
              facebookToken.access_token, facebookToken.user_id, fbText, imageUrl
            );
          } else {
            result = await createFacebookTextPost(
              facebookToken.access_token, facebookToken.user_id, fbText
            );
          }
          results.facebook = result;
        } catch (err) {
          errors.push(`Facebook: ${err.message}`);
        }
      } else {
        errors.push('Facebook: Not connected');
      }
    }

    // Publish to Instagram
    if (post.platform === 'instagram' || post.platform === 'both') {
      if (instagramToken) {
        try {
          if (!post.image_path) {
            errors.push('Instagram: Image is required for Instagram posts');
          } else {
            const imageUrl = resolveImageUrl(post.image_path);
            const result = await createInstagramImagePost(
              instagramToken.access_token, instagramToken.user_id, imageUrl, igText
            );
            results.instagram = result;
          }
        } catch (err) {
          errors.push(`Instagram: ${err.message}`);
        }
      } else {
        errors.push('Instagram: Not connected');
      }
    }

    // Update post status
    const hasSuccess = results.facebook || results.instagram;
    const newStatus = hasSuccess ? 'published' : 'failed';

    await updatePost(postId, {
      status: newStatus,
      facebook_post_id: results.facebook?.postId || null,
      instagram_post_id: results.instagram?.postId || null,
      published_at: hasSuccess ? new Date().toISOString() : null,
    });

    return NextResponse.json({
      success: hasSuccess,
      results,
      errors: errors.length > 0 ? errors : undefined,
      via: 'direct',
    });
  } catch (error) {
    console.error('[api/publish] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
