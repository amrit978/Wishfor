import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session.valid || !session.user) {
    return NextResponse.json(
      { authenticated: false, isAdmin: false, user: null },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      isAdmin: session.isAdmin,
      user: session.user,
    },
    { status: 200 }
  );
}

export async function DELETE() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

