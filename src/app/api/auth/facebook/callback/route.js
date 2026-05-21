import { NextResponse } from 'next/server';
import { upsertToken } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Meta sends ?error= when the user denies permission
  if (error) {
    const detail = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(new URL(`/settings?error=facebook_auth_failed&detail=${detail}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=facebook_auth_failed&detail=No+authorization+code+received', request.url));
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (baseUrl) {
    baseUrl = baseUrl.replace(/\/+$/, '');
  } else {
    const callbackUrl = new URL(request.url);
    const host = request.headers.get('x-forwarded-host') || callbackUrl.host;
    const proto = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    baseUrl = `${proto}://${host}`;
  }
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

  console.log('[FB Auth] Redirect URI used:', redirectUri);

  try {
    // 1. Exchange code for Short-Lived Access Token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      const metaError = tokenData.error?.message || JSON.stringify(tokenData);
      console.error('[FB Auth] Token exchange failed:', metaError);
      throw new Error(`Meta API: ${metaError}`);
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for Long-Lived User Token (lasts 60 days)
    const longTokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );
    const longTokenData = await longTokenResponse.json();
    // Use the long-lived token
    const userToken = longTokenData.access_token || shortLivedToken;
    const expiresIn = longTokenData.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // DEBUG: Fetch the logged-in user's profile to see who actually connected
    const meResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${userToken}`);
    const meData = await meResponse.json();
    console.log('[FB Auth Debug] Logged-in User Profile:', JSON.stringify(meData));

    // 3. Fetch the Facebook Pages the user manages
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`);
    const pagesData = await pagesResponse.json();

    console.log('[FB Auth Debug] Pages API Raw Response:', JSON.stringify(pagesData));

    if (pagesData.error) {
      throw new Error(`Pages API: ${pagesData.error.message}`);
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error(`No Facebook Pages found for user ${meData.name} (${meData.id}). Make sure you are logged in as the Page Admin and have granted permissions in the popup.`);
    }

    // Use the first page (user can change later)
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;

    console.log('[FB Auth] Connected page:', pageName, pageId);

    // 4. Save Page Access Token to Database
    await upsertToken('facebook', {
      access_token: pageAccessToken,
      refresh_token: null,
      user_id: pageId,
      user_name: pageName,
      expires_at: expiresAt,
    });

    // Check if an Instagram Business account is connected to this Page, and if so, auto-connect it
    try {
      const igResponse = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        const igAccountId = igData.instagram_business_account.id;
        const usernameResponse = await fetch(
          `https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${pageAccessToken}`
        );
        const usernameData = await usernameResponse.json();
        const igUsername = usernameData.username;

        console.log('[FB Auth Callback] Auto-connecting Instagram account:', igUsername, igAccountId);
        
        await upsertToken('instagram', {
          access_token: pageAccessToken,
          refresh_token: null,
          user_id: igAccountId,
          user_name: `@${igUsername}`,
          expires_at: expiresAt,
        });
      }
    } catch (igErr) {
      console.warn('[FB Auth Callback] Failed to auto-connect Instagram:', igErr.message);
    }

    return NextResponse.redirect(new URL('/settings?success=facebook_connected', request.url));

  } catch (err) {
    console.error('[FB Auth] Callback exception:', err.message);
    const detail = encodeURIComponent((err.message || 'unknown error').substring(0, 200));
    return NextResponse.redirect(new URL(`/settings?error=facebook_callback_failed&detail=${detail}`, request.url));
  }
}
