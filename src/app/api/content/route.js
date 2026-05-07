import { NextResponse } from 'next/server';
import { getAllPosts, createPost } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      platform: searchParams.get('platform') || undefined,
      month: searchParams.get('month') || undefined,
      year: searchParams.get('year') || undefined,
    };

    const posts = getAllPosts(filters);
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const post = createPost(data);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
