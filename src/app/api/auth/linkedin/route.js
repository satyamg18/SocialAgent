import { NextResponse } from 'next/server';

export async function GET(request) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID is not configured in .env.local' }, { status: 400 });
  }

  // Generate a random state string for CSRF protection
  const state = Math.random().toString(36).substring(7);
  
  // LinkedIn V2 OAuth URL
  // We need openid and profile to get the user's name/URN, and w_member_social to post
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'openid profile w_member_social');

  return NextResponse.redirect(authUrl.toString());
}
