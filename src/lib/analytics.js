import { getAllPosts, updatePost, getToken } from './db';

export async function syncAllPostsAnalytics() {
  // 1. Get all published posts
  const publishedPosts = await getAllPosts({ status: 'published' });
  
  if (publishedPosts.length === 0) {
    return { message: 'No published posts to analyze.', count: 0 };
  }

  // 2. Gather token info
  const facebookToken = await getToken('facebook');
  const instagramToken = await getToken('instagram');

  let updatedCount = 0;

  // 3. Update stats for each post
  for (const post of publishedPosts) {
    let fbLikes = 0;
    let fbComments = 0;
    let fbShares = 0;
    let fbImpressions = 0;

    let igLikes = 0;
    let igComments = 0;
    let igImpressions = 0;

    // Update Facebook Stats
    if (post.facebook_post_id && facebookToken?.access_token) {
      try {
        // 1. Query likes and comments
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${post.facebook_post_id}?fields=likes.summary(true),comments.summary(true)&access_token=${facebookToken.access_token}`);
        
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          fbLikes = fbData.likes?.summary?.total_count || 0;
          fbComments = fbData.comments?.summary?.total_count || 0;
        }

        // 2. Query shares separately (may fail on photo posts, but won't block likes/comments)
        try {
          const fbSharesRes = await fetch(`https://graph.facebook.com/v19.0/${post.facebook_post_id}?fields=shares&access_token=${facebookToken.access_token}`);
          if (fbSharesRes.ok) {
            const fbSharesData = await fbSharesRes.json();
            fbShares = fbSharesData.shares?.count || 0;
          }
        } catch (e) {
          // ignore shares failure
        }

        // 3. Resolve page_story_id for photo posts to enable post-level insights (impressions)
        let targetFbPostId = post.facebook_post_id;
        try {
          const photoRes = await fetch(`https://graph.facebook.com/v19.0/${post.facebook_post_id}?fields=page_story_id&access_token=${facebookToken.access_token}`);
          if (photoRes.ok) {
            const photoData = await photoRes.json();
            if (photoData.page_story_id) {
              targetFbPostId = photoData.page_story_id;
            }
          }
        } catch (e) {
          // ignore and fall back to post.facebook_post_id
        }

        // 4. Query impressions (Insights API)
        const fbInsightsRes = await fetch(`https://graph.facebook.com/v19.0/${targetFbPostId}/insights?metric=post_impressions&access_token=${facebookToken.access_token}`);
        if (fbInsightsRes.ok) {
          const fbInsightsData = await fbInsightsRes.json();
          fbImpressions = fbInsightsData.data?.[0]?.values?.[0]?.value || 0;
        }
      } catch (e) {
        console.warn(`Failed to fetch Facebook stats for post ${post.id}`, e);
      }
    }

    // Update Instagram Stats
    if (post.instagram_post_id && instagramToken?.access_token) {
      try {
        // Query likes and comments
        const igRes = await fetch(`https://graph.facebook.com/v19.0/${post.instagram_post_id}?fields=like_count,comments_count&access_token=${instagramToken.access_token}`);
        
        if (igRes.ok) {
          const igData = await igRes.json();
          igLikes = igData.like_count || 0;
          igComments = igData.comments_count || 0;
        }

        // Query impressions (Insights API)
        const igInsightsRes = await fetch(`https://graph.facebook.com/v19.0/${post.instagram_post_id}/insights?metric=impressions&access_token=${instagramToken.access_token}`);
        if (igInsightsRes.ok) {
          const igInsightsData = await igInsightsRes.json();
          igImpressions = igInsightsData.data?.[0]?.values?.[0]?.value || 0;
        }
      } catch (e) {
        console.warn(`Failed to fetch Instagram stats for post ${post.id}`, e);
      }
    }

    // 4. Update the database with both breakdown and aggregate metrics
    await updatePost(post.id, {
      likes: fbLikes + igLikes,
      comments: fbComments + igComments,
      shares: fbShares,
      impressions: fbImpressions + igImpressions,
      
      fb_likes: fbLikes,
      fb_comments: fbComments,
      fb_shares: fbShares,
      fb_impressions: fbImpressions,
      
      ig_likes: igLikes,
      ig_comments: igComments,
      ig_impressions: igImpressions
    });
    
    updatedCount++;
  }

  return {
    message: `Successfully synced analytics for ${updatedCount} posts.`,
    count: updatedCount
  };
}
