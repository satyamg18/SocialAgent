import { NextResponse } from 'next/server';
import { upsertToken } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    const detail = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(new URL(`/settings?error=instagram_auth_failed&detail=${detail}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=instagram_auth_failed&detail=No+authorization+code+received', request.url));
  }

  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  // Derive redirect_uri from the actual request URL — this ALWAYS matches what was sent in the dialog
  const callbackUrl = new URL(request.url);
  const redirectUri = `${callbackUrl.protocol}//${callbackUrl.host}/api/auth/instagram/callback`;

  console.log('[IG Auth] Redirect URI used:', redirectUri);

  try {
    // 1. Exchange code for Short-Lived Access Token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      const metaError = tokenData.error?.message || JSON.stringify(tokenData);
      console.error('[IG Auth] Token exchange failed:', metaError);
      throw new Error(`Meta API: ${metaError}`);
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for Long-Lived Access Token (lasts 60 days)
    const longTokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );
    const longTokenData = await longTokenResponse.json();
    const accessToken = longTokenData.access_token || shortLivedToken;
    const expiresIn = longTokenData.expires_in || 5184000;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Fetch the Facebook Pages the user manages
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(`Pages API: ${pagesData.error.message}`);
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook Pages found. An Instagram Business account must be linked to a Facebook Page.');
    }

    // 4. Find the first page that has an Instagram Business Account connected
    let igAccountId = null;
    let igUsername = null;
    let pageAccessToken = null;

    for (const page of pagesData.data) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        igAccountId = igData.instagram_business_account.id;
        pageAccessToken = page.access_token;

        const usernameResponse = await fetch(
          `https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${accessToken}`
        );
        const usernameData = await usernameResponse.json();
        igUsername = usernameData.username;
        console.log('[IG Auth] Found IG Business account:', igUsername, igAccountId);
        break;
      }
    }

    if (!igAccountId) {
      throw new Error('No Instagram Business Account found on any Facebook Page. Go to Meta Business Suite and link your Instagram to your Facebook Page.');
    }

    // 5. Save to Database
    await upsertToken('instagram', {
      access_token: pageAccessToken || accessToken,
      refresh_token: null,
      user_id: igAccountId,
      user_name: `@${igUsername}`,
      expires_at: expiresAt,
    });

    return NextResponse.redirect(new URL('/settings?success=instagram_connected', request.url));

  } catch (err) {
    console.error('[IG Auth] Callback exception:', err.message);
    const detail = encodeURIComponent((err.message || 'unknown error').substring(0, 200));
    return NextResponse.redirect(new URL(`/settings?error=instagram_callback_failed&detail=${detail}`, request.url));
  }
}
