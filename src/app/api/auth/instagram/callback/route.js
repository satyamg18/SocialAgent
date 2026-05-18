import { NextResponse } from 'next/server';
import { upsertToken } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Instagram OAuth Error:', error);
    return NextResponse.redirect(new URL('/settings?error=instagram_auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code_provided', request.url));
  }

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`;

  try {
    // 1. Exchange code for Short-Lived Access Token
    const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Meta Token Error:', tokenData);
      throw new Error('Failed to get short-lived access token');
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for Long-Lived Access Token (lasts 60 days)
    const longTokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
    const longTokenData = await longTokenResponse.json();
    
    const accessToken = longTokenData.access_token || shortLivedToken;
    const expiresIn = longTokenData.expires_in || 5184000; // default to 60 days if not provided
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Fetch the Facebook Pages the user manages
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook Pages found for this user.');
    }

    // 4. Find the first page that has an Instagram Business Account connected
    let igAccountId = null;
    let igUsername = null;
    let pageAccessToken = null;

    for (const page of pagesData.data) {
      const igResponse = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
      const igData = await igResponse.json();
      
      if (igData.instagram_business_account) {
        igAccountId = igData.instagram_business_account.id;
        pageAccessToken = page.access_token;
        
        // Fetch the IG username
        const usernameResponse = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${accessToken}`);
        const usernameData = await usernameResponse.json();
        igUsername = usernameData.username;
        break;
      }
    }

    if (!igAccountId) {
      throw new Error('No linked Instagram Business Account found on any of your Facebook Pages.');
    }

    // 5. Save to Database
    // We store the IG Account ID as user_id and the Page Access Token as access_token
    await upsertToken('instagram', {
      access_token: pageAccessToken || accessToken, // usually need page token or user token with right permissions
      refresh_token: null, // Meta doesn't use refresh tokens, you must get a new long-lived token
      user_id: igAccountId,
      user_name: `@${igUsername}`,
      expires_at: expiresAt,
    });

    return NextResponse.redirect(new URL('/settings?success=instagram_connected', request.url));

  } catch (err) {
    console.error('Instagram Callback Exception:', err);
    return NextResponse.redirect(new URL('/settings?error=instagram_callback_failed', request.url));
  }
}
