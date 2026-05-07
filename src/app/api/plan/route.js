import { NextResponse } from 'next/server';
import { getMonthlyPlan, getAllMonthlyPlans, upsertMonthlyPlan } from '@/lib/db';
import { smartGenPlan } from '@/lib/n8n';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (month && year) {
      const plan = getMonthlyPlan(Number(month), Number(year));
      return NextResponse.json({ plan });
    }

    const plans = getAllMonthlyPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.month || !data.year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    // If requesting AI suggestion — route through n8n
    if (data.suggest) {
      const suggestions = await smartGenPlan(
        data.month,
        data.year,
        data.theme,
        data.goals,
        data.target_audience
      );

      // Save plan with suggestions
      const plan = upsertMonthlyPlan({
        ...data,
        suggested_posts: JSON.stringify(suggestions),
      });

      return NextResponse.json({ plan, suggestions });
    }

    const plan = upsertMonthlyPlan(data);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('[api/plan] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
