import { NextResponse } from 'next/server';

export async function GET(request) {
  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
  const requestUrl = new URL(request.url);
  const redirectUri = `${requestUrl.protocol}//${requestUrl.host}/api/auth/instagram/callback`;

  if (!appId) {
    return NextResponse.json({ error: 'Neither INSTAGRAM_APP_ID nor FACEBOOK_APP_ID is configured in environment variables.' }, { status: 400 });
  }

  const state = Math.random().toString(36).substring(7);
  
  // Facebook/Meta OAuth URL for Instagram Graph API
  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  authUrl.searchParams.append('client_id', appId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  
  // Scopes needed to post to Instagram on behalf of the user
  // pages_show_list: To see which Facebook pages the user manages
  // instagram_basic: To read the IG account info connected to the page
  // instagram_content_publish: To actually publish the posts
  authUrl.searchParams.append('scope', 'instagram_basic,instagram_content_publish,pages_show_list,business_management');
  authUrl.searchParams.append('response_type', 'code');

  return NextResponse.redirect(authUrl.toString());
}
