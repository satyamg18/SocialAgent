import { NextResponse } from 'next/server';
import { syncAllPostsAnalytics } from '@/lib/analytics';

export async function POST() {
  try {
    const result = await syncAllPostsAnalytics();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Manual Sync] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
