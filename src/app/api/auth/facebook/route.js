import { NextResponse } from 'next/server';

export async function GET(request) {
  const appId = process.env.FACEBOOK_APP_ID;
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (baseUrl) {
    baseUrl = baseUrl.replace(/\/+$/, '');
  } else {
    const requestUrl = new URL(request.url);
    const host = request.headers.get('x-forwarded-host') || requestUrl.host;
    const proto = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    baseUrl = `${proto}://${host}`;
  }
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

  if (!appId) {
    return NextResponse.json({ error: 'FACEBOOK_APP_ID is not configured in .env.local' }, { status: 400 });
  }

  const state = Math.random().toString(36).substring(7);

  // Facebook OAuth URL
  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  authUrl.searchParams.append('client_id', appId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  // Requested scopes include both Facebook Page management, insights, and Instagram access
  authUrl.searchParams.append('scope', 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,read_insights,business_management,instagram_basic,instagram_content_publish,instagram_manage_insights');
  authUrl.searchParams.append('response_type', 'code');


  return NextResponse.redirect(authUrl.toString());
}
