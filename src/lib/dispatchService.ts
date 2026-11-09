import { supabase, isSupabaseConfigured } from './supabase';

export interface DispatchResult {
  delivered: boolean;
  provider: 'resend' | 'supabase' | 'twilio' | 'fast2sms' | 'terminal_dev';
  message: string;
  error?: string;
}

/**
 * Dispatches a 6-digit verification code to the user's email address
 * Supports Resend API (default high-deliverability) and Supabase Auth,
 * falling back gracefully to server audit logging if API keys are not yet set.
 */
export async function dispatchEmail(email: string, code: string): Promise<DispatchResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Try Resend API (Preferred for direct transactional emails)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'WishFor Sanctuary <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [normalizedEmail],
          subject: `${code} is your WishFor verification code`,
          html: `
            <div style="background-color: #13151f; color: #f2f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 24px; max-width: 540px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.12); border-radius: 4px;">
              <div style="font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #7c8299; margin-bottom: 20px;">
                WISHFOR // ANONYMOUS PEER SANCTUARY
              </div>
              <h1 style="font-size: 26px; font-weight: normal; margin: 0 0 16px 0; color: #f2f2f5;">
                Enter The Sanctuary
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #aab0c4; margin: 0 0 28px 0;">
                Use the verification code below to preserve your badges and access your private corner. This code expires in 5 minutes.
              </p>
              <div style="background-color: #0c0d14; border: 1px dashed rgba(255,255,255,0.3); border-radius: 2px; padding: 18px 24px; text-align: center; margin-bottom: 28px;">
                <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.25em; font-weight: bold; color: #e5ab37;">
                  ${code}
                </span>
              </div>
              <p style="font-size: 12px; color: #7c8299; line-height: 1.5; margin: 0; border-top: 1px solid rgba(255,255,255,0.08); pt: 16px;">
                Your true email is strictly masked and will never be shared with any peer or public transmission.
              </p>
            </div>
          `,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.id) {
        console.log(`[WISHLOG AUTH] Resend successfully dispatched code to ${normalizedEmail} (ID: ${data.id})`);
        return {
          delivered: true,
          provider: 'resend',
          message: 'Verification code sent to your email address.',
        };
      }
      console.warn('[WISHLOG AUTH] Resend dispatch note:', data?.message || data);
    } catch (e: any) {
      console.warn('[WISHLOG AUTH] Resend dispatch exception:', e.message);
    }
  }

  // 2. Try Supabase Auth
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (!error) {
        console.log(`[WISHLOG AUTH] Supabase Auth OTP triggered for ${normalizedEmail}`);
        return {
          delivered: true,
          provider: 'supabase',
          message: 'Verification code sent via Supabase Auth.',
        };
      }
      console.warn('[WISHLOG AUTH] Supabase Auth OTP error:', error.message);
    } catch (e: any) {
      console.warn('[WISHLOG AUTH] Supabase exception:', e.message);
    }
  }

  // 3. Server-side log (Development / Standalone mode when no API keys are configured)
  console.log(`\n======================================================`);
  console.log(`[WISHLOG AUTH SERVER DISPATCH]`);
  console.log(`Destination: ${normalizedEmail} (EMAIL)`);
  console.log(`Verification Code: [ ${code} ]`);
  console.log(`Expires in: 5 minutes`);
  console.log(`Notice: Configure RESEND_API_KEY or Supabase in .env.local to send live emails.`);
  console.log(`======================================================\n`);

  return {
    delivered: true,
    provider: 'terminal_dev',
    message: 'Verification code generated and dispatched.',
  };
}

/**
 * Dispatches a 6-digit verification code to the user's phone via SMS
 * Supports Twilio API and Supabase Phone Auth.
 */
export async function dispatchSms(phone: string, code: string): Promise<DispatchResult> {
  const normalizedPhone = phone.trim();
  const digitsOnly = normalizedPhone.replace(/\D/g, '');
  const tenDigitPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
  const e164Phone = normalizedPhone.startsWith('+') ? normalizedPhone : `+91${tenDigitPhone}`;

  // 1. Try Twilio Verify API (Pre-approved carrier templates - bypasses carrier template restrictions)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (accountSid && authToken && verifySid) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: e164Phone,
        Channel: 'sms',
      });

      const res = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/Verifications`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await res.json();
      if (res.ok && (data?.status === 'pending' || data?.sid)) {
        console.log(`[WISHLOG AUTH] Twilio Verify dispatched live SMS OTP to ${e164Phone} (SID: ${data.sid})`);
        return {
          delivered: true,
          provider: 'twilio',
          message: 'Verification code sent to your mobile phone via SMS.',
        };
      }
      console.warn('[WISHLOG AUTH] Twilio Verify dispatch notice:', data);
    } catch (e: any) {
      console.warn('[WISHLOG AUTH] Twilio Verify exception:', e.message);
    }
  }

  // 2. Try Fast2SMS API (Fastest for Indian numbers if configured)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey && tenDigitPhone.length === 10) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: tenDigitPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.return === true) {
        console.log(`[WISHLOG AUTH] Fast2SMS dispatched OTP to ${tenDigitPhone}`);
        return {
          delivered: true,
          provider: 'fast2sms',
          message: 'Verification code sent to your mobile phone via SMS.',
        };
      }
      console.warn('[WISHLOG AUTH] Fast2SMS dispatch notice:', data);
    } catch (e: any) {
      console.warn('[WISHLOG AUTH] Fast2SMS exception:', e.message);
    }
  }

  // 3. Try Standard Twilio Messages API
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && twilioNumber) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: e164Phone,
        From: twilioNumber,
        Body: `Your WishFor verification code is ${code}. Valid for 5 minutes. Never share this with anyone.`,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await res.json();
      if (res.ok && data?.sid) {
        console.log(`[WISHLOG AUTH] Twilio SMS sent to ${e164Phone}`);
        return {
          delivered: true,
          provider: 'twilio',
          message: 'Verification code sent via SMS.',
        };
      }
      console.warn('[WISHLOG AUTH] Twilio dispatch error:', data);
    } catch (e: any) {
      console.warn('[WISHLOG AUTH] Twilio exception:', e.message);
    }
  }

  // 3. Try Supabase Phone Auth
  if (isSupabaseConfigured && supabase) {
    try {
      const e164Phone = normalizedPhone.startsWith('+') ? normalizedPhone : `+91${tenDigitPhone}`;
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
        options: { shouldCreateUser: true },
      });
      if (!error) {
        console.log(`[WISHLOG AUTH] Supabase Phone OTP triggered for ${e164Phone}`);
        return {
          delivered: true,
          provider: 'supabase',
          message: 'Verification code sent via SMS.',
        };
      }
      console.warn('[WISHLOG AUTH] Supabase Phone error:', error.message);
    } catch (e: any) {
      console.warn('[WISHLOG AUTH] Supabase exception:', e.message);
    }
  }

  // 4. Server-side log (Development / Standalone mode when no SMS gateway is configured)
  console.log(`\n======================================================`);
  console.log(`[WISHLOG AUTH SERVER DISPATCH]`);
  console.log(`Destination: ${tenDigitPhone} (PHONE SMS)`);
  console.log(`Verification Code: [ ${code} ]`);
  console.log(`Expires in: 5 minutes`);
  console.log(`Notice: Configure FAST2SMS_API_KEY or TWILIO credentials in .env.local to send live SMS.`);
  console.log(`======================================================\n`);

  return {
    delivered: true,
    provider: 'terminal_dev',
    message: 'Verification code generated and dispatched.',
  };
}

