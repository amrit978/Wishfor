import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/serverAuth';
import { deleteServerPost } from '@/lib/serverStore';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session.valid || !session.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.' },
      { status: 401 }
    );
  }

  if (!session.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Only an authorized sanctuary admin can permanently delete posts here.' },
      { status: 403 }
    );
  }

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing post ID.' }, { status: 400 });
    }

    const result = await deleteServerPost(id.trim());
    if (!result.success) {
      return NextResponse.json(
        { ...result, postId: id },
        { status: result.requiresServiceRole ? 503 : 500 }
      );
    }

    return NextResponse.json({
      ...result,
      postId: id,
    });
  } catch (err) {
    console.error('[Post DELETE Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error deleting post.' },
      { status: 500 }
    );
  }
}
