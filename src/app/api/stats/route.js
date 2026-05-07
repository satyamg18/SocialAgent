import { NextResponse } from 'next/server';
import { getPostStats, getToken, hasGeminiKey } from '@/lib/db';

export async function GET() {
  try {
    const stats = getPostStats();
    const linkedinToken = getToken('linkedin');
    const instagramToken = getToken('instagram');

    return NextResponse.json({
      stats,
      connections: {
        linkedin: !!linkedinToken,
        instagram: !!instagramToken,
        linkedinUser: linkedinToken?.user_name || null,
        instagramUser: instagramToken?.user_name || null,
      },
      config: {
        hasGeminiKey: hasGeminiKey(),
        n8nEnabled: process.env.N8N_ENABLED !== 'false',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
