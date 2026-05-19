// Instagram Graph API Integration
// Docs: https://developers.facebook.com/docs/instagram-api/

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

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
