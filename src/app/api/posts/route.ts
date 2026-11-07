import { NextRequest, NextResponse } from 'next/server';
import { validateProblemContent } from '@/lib/serverModeration';
import { INITIAL_POSTS } from '@/lib/initialData';
import { getMaskForThread, getTrustLevel } from '@/lib/anonymity';

export async function GET(request: NextRequest) {
  // In API responses, user_id and email are strictly omitted.
  const sanitized = INITIAL_POSTS.map(({ ...rest }) => rest);
  return NextResponse.json({ posts: sanitized });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, body, category, is_urgent, is_draft } = data;

    const validation = validateProblemContent(title, body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const postId = `post_${Date.now()}`;
    const pseudoUser = `user_${Math.random().toString(36).substring(2, 8)}`;
    const threadMask = getMaskForThread(pseudoUser, postId, true);

    const post = {
      id: postId,
      category,
      title: title?.trim() || undefined,
      body: body.trim(),
      is_urgent: Boolean(is_urgent),
      status: is_draft ? 'draft' : 'published',
      report_count: 0,
      reply_count: 0,
      helped_reply_id: null,
      crisis_flagged: validation.isCrisis,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mask_name: threadMask.mask_name,
      mask_seed: threadMask.mask_seed,
      is_asker: true,
      trust_level: 'Newcomer',
    };

    return NextResponse.json({ success: true, post, crisisDetected: validation.isCrisis });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error processing whisper.' }, { status: 500 });
  }
}

