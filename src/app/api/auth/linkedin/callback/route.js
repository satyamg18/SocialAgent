import { NextResponse } from 'next/server';
import { upsertToken } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error('LinkedIn OAuth Error:', error, errorDescription);
    return NextResponse.redirect(new URL('/settings?error=linkedin_auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code_provided', request.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`;

  try {
    // 1. Exchange code for Access Token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('LinkedIn Token Error:', tokenData);
      throw new Error('Failed to get access token');
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in; // in seconds
    
    // Calculate expiration date
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 2. Get User Profile (to get the URN / Name)
    // We use the OIDC userinfo endpoint as per modern LinkedIn API
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error('LinkedIn Profile Error:', profileData);
      throw new Error('Failed to get user profile');
    }

    // The sub field is the member URN ID, name is the full name
    const userId = profileData.sub;
    const userName = profileData.name;

    // 3. Save to Database
    await upsertToken('linkedin', {
      access_token: accessToken,
      refresh_token: tokenData.refresh_token || null,
      user_id: userId,
      user_name: userName,
      expires_at: expiresAt,
    });

    // 4. Redirect back to settings page with success
    return NextResponse.redirect(new URL('/settings?success=linkedin_connected', request.url));

  } catch (err) {
    console.error('LinkedIn Callback Exception:', err);
    return NextResponse.redirect(new URL('/settings?error=linkedin_callback_failed', request.url));
  }
}
