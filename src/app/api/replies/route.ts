import { NextRequest, NextResponse } from 'next/server';
import { getServerReplies, createServerReply } from '@/lib/serverStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ success: false, error: 'postId parameter is required.' }, { status: 400 });
    }

    const replies = await getServerReplies(postId);
    return NextResponse.json({ success: true, replies });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error retrieving replies.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, postId, body, parentReplyId, isAsker } = data;

    if (!postId) {
      return NextResponse.json({ success: false, error: 'postId is required.' }, { status: 400 });
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const result = await createServerReply({
      id,
      postId,
      body,
      parentReplyId,
      isAsker: Boolean(isAsker),
      clientIp,
    });

    if (!result.success) {
      const status = result.waitSeconds ? 429 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error saving advice.' },
      { status: 500 }
    );
  }
}
