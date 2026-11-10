import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, code, ticket: bodyTicket } = body;
    const method = body.method || 'email';

    if (!identifier || !code) {
      return NextResponse.json(
        { success: false, error: 'Email address and 6-digit code are required.' },
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

    const ticket = bodyTicket || request.cookies.get('wishfor_otp_ticket')?.value;
    const result = await verifyOtp(identifier, 'email', code, ticket);

    if (!result.success) {
      const status = result.error === 'MAX_ATTEMPTS_EXCEEDED' ? 429 : 400;
      return NextResponse.json(result, { status });
    }

    const response = NextResponse.json(result, { status: 200 });
    response.cookies.delete('wishfor_otp_ticket');
    return response;
  } catch (err: any) {
    console.error('[Verify-OTP API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying code.' },
      { status: 500 }
    );
  }
}

