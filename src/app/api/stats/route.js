import { NextResponse } from 'next/server';
import { getPostStats, getToken } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getPostStats();
    const facebookToken = await getToken('facebook');
    const instagramToken = await getToken('instagram');

    return NextResponse.json({
      stats,
      connections: {
        facebook: !!facebookToken,
        instagram: !!instagramToken,
        facebookUser: facebookToken?.user_name || null,
        instagramUser: instagramToken?.user_name || null,
      },
      config: {
        hasGroqKey: !!process.env.GROQ_API_KEY,
        n8nEnabled: process.env.N8N_ENABLED !== 'false',
        hasFacebookKeys: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
        hasInstagramKeys: !!(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
