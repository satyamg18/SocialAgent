import { NextResponse } from 'next/server';
import { deleteToken } from '@/lib/db';

export async function POST(request) {
  try {
    const { platform } = await request.json();
    if (platform !== 'facebook' && platform !== 'instagram') {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }
    await deleteToken(platform);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
