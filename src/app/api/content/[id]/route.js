import { NextResponse } from 'next/server';
import { getPostById, updatePost, deletePost } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const post = getPostById(Number(id));
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const existing = getPostById(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = updatePost(Number(id), data);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = getPostById(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    deletePost(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
