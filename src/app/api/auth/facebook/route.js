import { NextResponse } from 'next/server';

export async function GET(request) {
  const appId = process.env.FACEBOOK_APP_ID;
  const requestUrl = new URL(request.url);
  const redirectUri = `${requestUrl.protocol}//${requestUrl.host}/api/auth/facebook/callback`;

  if (!appId) {
    return NextResponse.json({ error: 'FACEBOOK_APP_ID is not configured in .env.local' }, { status: 400 });
  }

  const state = Math.random().toString(36).substring(7);

  // Facebook OAuth URL
  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  authUrl.searchParams.append('client_id', appId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,business_management');
  authUrl.searchParams.append('response_type', 'code');


  return NextResponse.redirect(authUrl.toString());
}
