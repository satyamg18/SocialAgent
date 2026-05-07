// LinkedIn API Integration
// Docs: https://learn.microsoft.com/en-us/linkedin/

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2';

export function getLinkedInAuthUrl() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const scope = 'openid profile w_member_social';
  const state = Math.random().toString(36).substring(7);

  return `${LINKEDIN_AUTH_URL}/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
}

export async function exchangeLinkedInCode(code) {
  const res = await fetch(`${LINKEDIN_AUTH_URL}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${err}`);
  }

  return res.json();
}

export async function getLinkedInProfile(accessToken) {
  const res = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to get LinkedIn profile');
  return res.json();
}

export async function createLinkedInTextPost(accessToken, authorUrn, text) {
  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202602',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: authorUrn,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn post failed: ${err}`);
  }

  const postId = res.headers.get('x-restli-id');
  return { postId, success: true };
}

export async function uploadLinkedInImage(accessToken, authorUrn, imagePath) {
  // Step 1: Initialize upload
  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202602',
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: authorUrn,
      },
    }),
  });

  if (!initRes.ok) throw new Error('Failed to initialize LinkedIn image upload');
  const initData = await initRes.json();
  const uploadUrl = initData.value.uploadUrl;
  const imageUrn = initData.value.image;

  // Step 2: Upload image binary
  const fs = require('fs');
  const imageBuffer = fs.readFileSync(imagePath);

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) throw new Error('Failed to upload image to LinkedIn');

  return imageUrn;
}

export async function createLinkedInImagePost(accessToken, authorUrn, text, imagePath) {
  const imageUrn = await uploadLinkedInImage(accessToken, authorUrn, imagePath);

  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202602',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: authorUrn,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          title: 'Post Image',
          id: imageUrn,
        },
      },
      lifecycleState: 'PUBLISHED',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn image post failed: ${err}`);
  }

  const postId = res.headers.get('x-restli-id');
  return { postId, success: true };
}
