// Instagram Graph API Integration
// Docs: https://developers.facebook.com/docs/instagram-api/

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';
const FB_AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';

export function getInstagramAuthUrl() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
  const state = Math.random().toString(36).substring(7);

  return `${FB_AUTH_URL}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;
}

export async function exchangeInstagramCode(code) {
  const res = await fetch(`${GRAPH_API_BASE}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code,
    }),
  });

  if (!res.ok) throw new Error('Instagram token exchange failed');
  const data = await res.json();

  // Exchange for long-lived token
  const longRes = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.INSTAGRAM_APP_ID}&client_secret=${process.env.INSTAGRAM_APP_SECRET}&fb_exchange_token=${data.access_token}`
  );

  if (!longRes.ok) throw new Error('Failed to get long-lived token');
  return longRes.json();
}

export async function getInstagramBusinessAccount(accessToken) {
  // Get Facebook pages
  const pagesRes = await fetch(`${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`);
  if (!pagesRes.ok) throw new Error('Failed to get Facebook pages');
  const pagesData = await pagesRes.json();

  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('No Facebook pages found. Instagram must be linked to a Facebook page.');
  }

  // Get Instagram business account linked to first page
  const pageId = pagesData.data[0].id;
  const pageToken = pagesData.data[0].access_token;
  const igRes = await fetch(
    `${GRAPH_API_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
  );

  if (!igRes.ok) throw new Error('Failed to get Instagram business account');
  const igData = await igRes.json();

  if (!igData.instagram_business_account) {
    throw new Error('No Instagram business account linked to this Facebook page');
  }

  return {
    igUserId: igData.instagram_business_account.id,
    pageToken,
    pageName: pagesData.data[0].name,
  };
}

export async function createInstagramImagePost(accessToken, igUserId, imageUrl, caption) {
  // Step 1: Create media container
  const containerRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    }),
  });

  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Instagram container creation failed: ${err}`);
  }

  const containerData = await containerRes.json();
  const creationId = containerData.id;

  // Step 2: Wait for container to be ready (poll status)
  await waitForContainer(accessToken, creationId);

  // Step 3: Publish
  const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken,
    }),
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish failed: ${err}`);
  }

  const publishData = await publishRes.json();
  return { postId: publishData.id, success: true };
}

async function waitForContainer(accessToken, containerId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );

    if (res.ok) {
      const data = await res.json();
      if (data.status_code === 'FINISHED') return;
      if (data.status_code === 'ERROR') throw new Error('Instagram media container error');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Instagram media container timed out');
}
