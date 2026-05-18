import { NextResponse } from 'next/server';
import { getAllPosts, updatePost, getToken } from '@/lib/db';
import { smartPublish } from '@/lib/n8n';
import path from 'path';

// Vercel Cron sends a Bearer token. We verify it to ensure only Vercel can trigger this.
// For local testing, you can bypass this by setting CRON_SECRET=test in your .env.local
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all approved posts
    const approvedPosts = await getAllPosts({ status: 'approved' });
    
    // 2. Filter posts that are due to be published
    const now = new Date();
    
    const postsToPublish = approvedPosts.filter(post => {
      if (!post.scheduled_date || !post.scheduled_time) return false;
      
      // Construct a Date object from the scheduled date and time
      const scheduledDateTime = new Date(`${post.scheduled_date}T${post.scheduled_time}:00`);
      
      // If the scheduled time is in the past or exactly now, it's ready to publish
      return scheduledDateTime <= now;
    });

    if (postsToPublish.length === 0) {
      return NextResponse.json({ message: 'No posts scheduled to publish at this time.', count: 0 });
    }

    // Gather token info (only once per cron run)
    const facebookToken = await getToken('facebook');
    const instagramToken = await getToken('instagram');

    const results = [];

    // 3. Publish each due post
    for (const post of postsToPublish) {
      try {
        console.log(`[Cron] Publishing post ${post.id}: ${post.title}`);
        
        // Update status to publishing so we don't accidentally publish it twice if cron runs concurrently
        await updatePost(post.id, { status: 'publishing' });

        const resolveImageUrl = (imgPath) => {
          if (!imgPath) return null;
          if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:')) return imgPath;
          return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${imgPath}`;
        };

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

        if (n8nResult.success) {
          await updatePost(post.id, {
            status: 'published',
            published_at: new Date().toISOString(),
            facebook_post_id: n8nResult.facebookPostId || null,
            instagram_post_id: n8nResult.instagramPostId || null,
          });
          results.push({ id: post.id, status: 'success' });
        } else {
          throw new Error(n8nResult.error || 'Unknown publishing error');
        }

      } catch (err) {
        console.error(`[Cron] Failed to publish post ${post.id}:`, err);
        await updatePost(post.id, { status: 'failed' });
        results.push({ id: post.id, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({
      message: `Processed ${postsToPublish.length} posts.`,
      results
    });

  } catch (error) {
    console.error('[Cron] Engine Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
