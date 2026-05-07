import { NextResponse } from 'next/server';
import { smartGenText } from '@/lib/n8n';

export async function POST(request) {
  try {
    const { gist, platform, tone } = await request.json();

    if (!gist) {
      return NextResponse.json({ error: 'Content gist is required' }, { status: 400 });
    }

    const content = await smartGenText(gist, platform || 'both', tone || 'professional');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('[api/generate/text] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
