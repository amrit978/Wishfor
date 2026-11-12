import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/serverAuth';
import {
  deleteServerPost,
  deleteServerReply,
  getAdminServerOverview,
} from '@/lib/serverStore';

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session.valid || !session.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in with your admin email.',
        },
        { status: 401 }
      ),
    };
  }

  if (!session.isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: 'Forbidden. Admin privileges are restricted to configured admin accounts.',
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    user: session.user,
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const overview = await getAdminServerOverview();
    return NextResponse.json({
      success: true,
      adminEmail: auth.user.email,
      ...overview,
    });
  } catch (err) {
    console.error('[Admin Overview Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Unable to load admin sanctuary ledger.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    let postId = url.searchParams.get('postId') || undefined;
    let replyId = url.searchParams.get('replyId') || undefined;

    if (!postId && !replyId) {
      try {
        const body = await request.json();
        postId = body?.postId;
        replyId = body?.replyId;
      } catch {
        // Empty JSON body handled below
      }
    }

    if (postId && typeof postId === 'string') {
      const result = await deleteServerPost(postId.trim());
      if (!result.success) {
        return NextResponse.json(
          { ...result, target: 'post', postId },
          { status: result.requiresServiceRole ? 503 : 500 }
        );
      }
      return NextResponse.json({
        ...result,
        target: 'post',
        postId,
      });
    }

    if (replyId && typeof replyId === 'string') {
      const result = await deleteServerReply(replyId.trim());
      if (!result.success) {
        return NextResponse.json(
          { ...result, target: 'reply', replyId },
          { status: result.requiresServiceRole ? 503 : 500 }
        );
      }
      return NextResponse.json({
        ...result,
        target: 'reply',
        replyId,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide a valid postId or replyId to delete.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[Admin Delete Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing admin deletion.' },
      { status: 500 }
    );
  }
}

