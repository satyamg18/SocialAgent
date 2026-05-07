import { NextResponse } from 'next/server';
import { smartGenImage } from '@/lib/n8n';

export async function POST(request) {
  try {
    const { visualGist, style } = await request.json();

    if (!visualGist) {
      return NextResponse.json({ error: 'Visual gist is required' }, { status: 400 });
    }

    const result = await smartGenImage(visualGist, style || 'modern');
    return NextResponse.json({ image: result });
  } catch (error) {
    console.error('[api/generate/image] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
