import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, method, code, ticket: bodyTicket } = body;

    if (!identifier || !method || !code) {
      return NextResponse.json(
        { success: false, error: 'Identifier, method, and 6-digit code are required.' },
        { status: 400 }
      );
    }

    if (method !== 'email' && method !== 'phone') {
      return NextResponse.json(
        { success: false, error: 'Method must be either "email" or "phone".' },
        { status: 400 }
      );
    }

    const ticket = bodyTicket || request.cookies.get('wishfor_otp_ticket')?.value;
    const result = await verifyOtp(identifier, method, code, ticket);

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

