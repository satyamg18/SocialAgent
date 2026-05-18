import { NextResponse } from 'next/server';
import { getPostById, updatePost, getToken } from '@/lib/db';
import { smartPublish } from '@/lib/n8n';
import { createLinkedInTextPost, createLinkedInImagePost } from '@/lib/platforms/linkedin';
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
    const linkedinToken = await getToken('linkedin');
    const instagramToken = await getToken('instagram');

    // Try n8n first
    const n8nResult = await smartPublish({
      platform: post.platform,
      text: post.written_content,
      imageUrl: post.image_path ? `${process.env.NEXT_PUBLIC_APP_URL}${post.image_path}` : null,
      imagePath: post.image_path ? path.join(process.cwd(), 'public', post.image_path) : null,
      linkedinToken: linkedinToken?.access_token || null,
      authorUrn: linkedinToken ? `urn:li:person:${linkedinToken.user_id}` : null,
      instagramToken: instagramToken?.access_token || null,
      igUserId: instagramToken?.user_id || null,
    });

    // If n8n handled it successfully
    if (n8nResult && !n8nResult.fallbackToDirect) {
      const hasSuccess = n8nResult.results?.linkedin || n8nResult.results?.instagram;
      const newStatus = hasSuccess ? 'published' : 'failed';

      await updatePost(postId, {
        status: newStatus,
        linkedin_post_id: n8nResult.results?.linkedin?.postId || null,
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
    const results = { linkedin: null, instagram: null };
    const errors = [];

    // Publish to LinkedIn
    if (post.platform === 'linkedin' || post.platform === 'both') {
      if (linkedinToken) {
        try {
          const authorUrn = `urn:li:person:${linkedinToken.user_id}`;
          let result;

          if (post.image_path) {
            const imagePath = path.join(process.cwd(), 'public', post.image_path);
            result = await createLinkedInImagePost(
              linkedinToken.access_token, authorUrn, post.written_content, imagePath
            );
          } else {
            result = await createLinkedInTextPost(
              linkedinToken.access_token, authorUrn, post.written_content
            );
          }
          results.linkedin = result;
        } catch (err) {
          errors.push(`LinkedIn: ${err.message}`);
        }
      } else {
        errors.push('LinkedIn: Not connected');
      }
    }

    // Publish to Instagram
    if (post.platform === 'instagram' || post.platform === 'both') {
      if (instagramToken) {
        try {
          if (!post.image_path) {
            errors.push('Instagram: Image is required for Instagram posts');
          } else {
            const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}${post.image_path}`;
            const result = await createInstagramImagePost(
              instagramToken.access_token, instagramToken.user_id, imageUrl, post.written_content
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
    const hasSuccess = results.linkedin || results.instagram;
    const newStatus = hasSuccess ? 'published' : 'failed';

    await updatePost(postId, {
      status: newStatus,
      linkedin_post_id: results.linkedin?.postId || null,
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
