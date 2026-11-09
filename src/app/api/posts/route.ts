import { NextRequest, NextResponse } from 'next/server';
import { getServerPosts, createServerPost } from '@/lib/serverStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const unanswered = searchParams.get('unanswered') === 'true';

    const posts = await getServerPosts({ category, unanswered });
    return NextResponse.json({ success: true, posts });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error retrieving transmissions.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: content, category, is_urgent, is_draft } = body;

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const result = await createServerPost({
      title,
      body: content,
      category,
      is_urgent,
      is_draft,
      clientIp,
    });

    if (!result.success) {
      const status = result.waitSeconds ? 429 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error processing whisper.' },
      { status: 500 }
    );
  }
}
