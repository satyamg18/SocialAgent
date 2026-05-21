import { NextResponse } from 'next/server';
import { syncAllPostsAnalytics } from '@/lib/analytics';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAllPostsAnalytics();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron Analytics] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
