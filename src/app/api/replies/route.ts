import { NextRequest, NextResponse } from 'next/server';
import { validateReplyContent } from '@/lib/serverModeration';
import { INITIAL_REPLIES } from '@/lib/initialData';
import { getMaskForThread } from '@/lib/anonymity';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  let results = INITIAL_REPLIES;
  if (postId) {
    results = results.filter((r) => r.post_id === postId);
  }

  // Sort by likes descending, ties broken by newest
  results.sort((a, b) => {
    if (b.like_count !== a.like_count) {
      return b.like_count - a.like_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({ replies: results });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { postId, body, parentReplyId, isAsker } = data;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const validation = validateReplyContent(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const pseudoUser = `user_${Math.random().toString(36).substring(2, 8)}`;
    const mask = getMaskForThread(pseudoUser, postId, Boolean(isAsker));

    const reply = {
      id: `reply_${Date.now()}`,
      post_id: postId,
      parent_reply_id: parentReplyId || null,
      body: body.trim(),
      like_count: 0,
      is_helped: false,
      status: 'published',
      report_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mask_name: mask.mask_name,
      mask_seed: mask.mask_seed,
      is_asker: Boolean(isAsker),
      trust_level: 'Newcomer',
    };

    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error saving advice.' }, { status: 500 });
  }
}

