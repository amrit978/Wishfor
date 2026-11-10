import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body;
    const method = body.method || 'email';

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    if (method === 'phone') {
      return NextResponse.json(
        { success: false, error: 'Phone OTP has been disabled. Please verify via email.' },
        { status: 400 }
      );
    }

    if (method !== 'email') {
      return NextResponse.json(
        { success: false, error: 'Only email authentication is supported.' },
        { status: 400 }
      );
    }

    const result = await sendOtp(identifier, 'email');

    if (!result.success) {
      const status = result.error === 'RATE_LIMIT_EXCEEDED' ? 429 : result.error === 'COOLDOWN_ACTIVE' ? 429 : 400;
      return NextResponse.json(result, { status });
    }

    const response = NextResponse.json(result, { status: 200 });
    if (result.ticket) {
      response.cookies.set('wishfor_otp_ticket', result.ticket, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 300,
        sameSite: 'lax',
        path: '/',
      });
    }
    return response;
  } catch (err: any) {
    console.error('[Send-OTP API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error dispatching verification code.' },
      { status: 500 }
    );
  }
}

