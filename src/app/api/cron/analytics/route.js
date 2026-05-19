import { NextResponse } from 'next/server';
import { getAllPosts, updatePost, getToken } from '@/lib/db';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all published posts
    const publishedPosts = await getAllPosts({ status: 'published' });
    
    if (publishedPosts.length === 0) {
      return NextResponse.json({ message: 'No published posts to analyze.', count: 0 });
    }

    // 2. Gather token info
    const facebookToken = await getToken('facebook');
    const instagramToken = await getToken('instagram');

    let updatedCount = 0;

    // 3. Update stats for each post
    for (const post of publishedPosts) {
      let likes = post.likes || 0;
      let comments = post.comments || 0;
      let impressions = post.impressions || 0;
      let shares = post.shares || 0;

      // Update Facebook Stats
      if (post.facebook_post_id && facebookToken?.access_token) {
        try {
          const fbRes = await fetch(`https://graph.facebook.com/v19.0/${post.facebook_post_id}?fields=likes.summary(true),comments.summary(true),shares&access_token=${facebookToken.access_token}`);
          
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            likes += (fbData.likes?.summary?.total_count || 0);
            comments += (fbData.comments?.summary?.total_count || 0);
            shares += (fbData.shares?.count || 0);
          }
        } catch (e) {
          console.warn(`Failed to fetch Facebook stats for post ${post.id}`);
        }
      }

      // Update Instagram Stats
      if (post.instagram_post_id && instagramToken?.access_token) {
        try {
          const igRes = await fetch(`https://graph.facebook.com/v19.0/${post.instagram_post_id}?fields=like_count,comments_count&access_token=${instagramToken.access_token}`);
          
          if (igRes.ok) {
            const igData = await igRes.json();
            likes += (igData.like_count || 0);
            comments += (igData.comments_count || 0);
          }
        } catch (e) {
          console.warn(`Failed to fetch Instagram stats for post ${post.id}`);
        }
      }


      // 4. Update the database
      await updatePost(post.id, {
        likes,
        comments,
        shares,
        impressions
      });
      
      updatedCount++;
    }

    return NextResponse.json({
      message: `Successfully synced analytics for ${updatedCount} posts.`,
    });

  } catch (error) {
    console.error('[Cron Analytics] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
