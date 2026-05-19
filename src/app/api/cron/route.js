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

    const results = [];

    // 3. Publish each due post
    for (const post of postsToPublish) {
      try {
        console.log(`[Cron] Publishing post ${post.id}: ${post.title}`);
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${request.headers.get('host')}`;
        const publishRes = await fetch(`${baseUrl}/api/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });
        
        const publishData = await publishRes.json();
        
        if (publishRes.ok && publishData.success) {
           results.push({ id: post.id, status: 'success' });
        } else {
           results.push({ id: post.id, status: 'failed', error: publishData.error || publishData.errors || 'Unknown publish error' });
        }
      } catch (err) {
        console.error(`[Cron] Failed to trigger publish for post ${post.id}:`, err);
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
