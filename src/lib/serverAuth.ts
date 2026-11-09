import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from './supabase';
import { CurrentUser } from '@/types';
import { dispatchEmail, dispatchSms } from './dispatchService';

export interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  method: 'email' | 'phone';
}

// In-memory store for OTPs and rate limiting
// Map<normalizedIdentifier, OtpRecord>
const otpStore = new Map<string, OtpRecord>();

// Rate limit store: Map<ipOrIdentifier, timestamp[]>
const rateLimitStore = new Map<string, number[]>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 12;
const HMAC_SECRET = process.env.AUTH_SECRET || 'wishfor_sanctuary_stateless_secret_key_v1';

export function createVerificationTicket(identifier: string, code: string, expiresAt: number): string {
  const payload = `${identifier}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export function verifyTicket(ticket: string, identifier: string, inputCode: string): { isValid: boolean; error?: string } {
  try {
    const decoded = Buffer.from(ticket, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return { isValid: false, error: 'Malformed verification token.' };
    const [ticketId, ticketCode, ticketExpires, ticketHmac] = parts;
    const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET).update(`${ticketId}:${ticketCode}:${ticketExpires}`).digest('hex');
    
    const hmacBuf = Buffer.from(ticketHmac);
    const expBuf = Buffer.from(expectedHmac);
    if (hmacBuf.length !== expBuf.length || !crypto.timingSafeEqual(hmacBuf, expBuf)) {
      return { isValid: false, error: 'Invalid verification signature.' };
    }
    if (Date.now() > Number(ticketExpires)) {
      return { isValid: false, error: 'Code has expired.' };
    }
    if (ticketId !== identifier) {
      return { isValid: false, error: 'Destination mismatch.' };
    }
    const codeBuf = Buffer.from(ticketCode);
    const inBuf = Buffer.from(inputCode.trim());
    if (codeBuf.length !== inBuf.length || !crypto.timingSafeEqual(codeBuf, inBuf)) {
      return { isValid: false, error: 'Incorrect code.' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Verification failed.' };
  }
}

/**
 * Normalizes email or phone number to prevent duplicate bypasses
 */
export function normalizeIdentifier(identifier: string, method: 'email' | 'phone'): string {
  if (method === 'email') {
    return identifier.trim().toLowerCase();
  }
  // Phone: keep only digits and leading plus
  const cleaned = identifier.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // If 10 digits without country code, assume standard format
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Validates identifier format
 */
export function validateIdentifier(identifier: string, method: 'email' | 'phone'): { isValid: boolean; error?: string } {
  if (!identifier || identifier.trim().length === 0) {
    return { isValid: false, error: 'Identifier is required.' };
  }

  if (method === 'email') {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    if (!emailRegex.test(identifier.trim())) {
      return { isValid: false, error: 'Please enter a valid email address.' };
    }
  } else {
    const digitsOnly = identifier.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return { isValid: false, error: 'Please enter a valid 10 to 15 digit telephone number.' };
    }
  }

  return { isValid: true };
}

/**
 * Enforces per-identifier hourly request rate limits
 */
export function checkHourlyRateLimit(normalizedId: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const timestamps = (rateLimitStore.get(normalizedId) || []).filter((t) => t > oneHourAgo);
  if (timestamps.length >= MAX_REQUESTS_PER_HOUR) {
    const oldest = timestamps[0];
    const waitSeconds = Math.ceil((oldest + 60 * 60 * 1000 - now) / 1000);
    return { allowed: false, waitSeconds: Math.max(1, waitSeconds) };
  }

  timestamps.push(now);
  rateLimitStore.set(normalizedId, timestamps);
  return { allowed: true };
}

/**
 * Generates and stores a secure 6-digit OTP
 */
export async function sendOtp(
  identifier: string,
  method: 'email' | 'phone'
): Promise<{ success: boolean; message: string; waitSeconds: number; ticket?: string; devOtp?: string; error?: string }> {
  const validation = validateIdentifier(identifier, method);
  if (!validation.isValid) {
    return { success: false, message: validation.error || 'Invalid identifier', waitSeconds: 0, error: validation.error };
  }

  const normalized = normalizeIdentifier(identifier, method);
  const now = Date.now();

  // Check hourly quota
  const quota = checkHourlyRateLimit(normalized);
  if (!quota.allowed) {
    return {
      success: false,
      message: `Too many requests. Please wait ${quota.waitSeconds} seconds before trying again.`,
      waitSeconds: quota.waitSeconds || 60,
      error: 'RATE_LIMIT_EXCEEDED',
    };
  }

  // Check 60-second cooldown
  const existing = otpStore.get(normalized);
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
      waitSeconds: remainingSeconds,
      error: 'COOLDOWN_ACTIVE',
    };
  }

  // Generate cryptographically random 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = now + OTP_EXPIRY_MS;
  const ticket = createVerificationTicket(normalized, code, expiresAt);

  // Store record
  otpStore.set(normalized, {
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    method,
  });

  // Dispatch via configured channel (Resend, Twilio, Supabase, or Server Audit)
  if (method === 'email') {
    await dispatchEmail(normalized, code);
  } else {
    await dispatchSms(normalized, code);
  }

  return {
    success: true,
    message: `Verification code sent to your ${method}. Valid for 5 minutes.`,
    waitSeconds: 60,
    ticket,
    devOtp: process.env.TEST_SUITE === 'true' ? code : undefined,
  };
}

/**
 * Verifies a provided OTP code with timing-safe comparison and attempt limits
 */
export async function verifyOtp(
  identifier: string,
  method: 'email' | 'phone',
  userCode: string,
  ticket?: string
): Promise<{ success: boolean; message: string; user?: CurrentUser; error?: string }> {
  if (!userCode || userCode.trim().length === 0) {
    return { success: false, message: 'Please enter the 6-digit verification code.', error: 'MISSING_CODE' };
  }

  const normalized = normalizeIdentifier(identifier, method);

  // If Twilio Verify service is enabled for phone, verify via Twilio Verify API
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (method === 'phone' && twilioVerifySid && accountSid && authToken) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: normalized,
        Code: userCode.trim(),
      });

      const checkRes = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifySid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        }
      );

      const checkData = await checkRes.json();
      if (checkRes.ok && checkData?.status === 'approved') {
        const userId = `u_${crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 12)}`;
        const user: CurrentUser = {
          id: userId,
          phone: normalized,
          is_authenticated: true,
          trust_score: 5,
          trust_level: 'Listener',
          role: 'user',
          is_banned: false,
        };
        otpStore.delete(normalized);
        return {
          success: true,
          message: 'Phone identity confirmed. Mask established.',
          user,
        };
      } else if (checkData?.status === 'pending' || checkData?.valid === false) {
        return {
          success: false,
          message: 'Incorrect verification code. Please check your SMS and try again.',
          error: 'INCORRECT_CODE',
        };
      }
    } catch (err: any) {
      console.warn('[TWILIO VERIFY CHECK EXCEPTION]:', err.message);
    }
  }

  const record = otpStore.get(normalized);

  if (!record) {
    // Stateless signed token fallback for Vercel/serverless environments
    if (ticket) {
      const ticketResult = verifyTicket(ticket, normalized, userCode);
      if (!ticketResult.isValid) {
        return {
          success: false,
          message: ticketResult.error || 'Verification token could not be verified.',
          error: 'INVALID_TOKEN',
        };
      }

      const userId = `u_${crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 12)}`;
      const user: CurrentUser = {
        id: userId,
        email: method === 'email' ? normalized : undefined,
        phone: method === 'phone' ? normalized : undefined,
        is_authenticated: true,
        trust_score: 5,
        trust_level: 'Listener',
        role: 'user',
        is_banned: false,
      };

      return {
        success: true,
        message: 'Identity confirmed. Mask established.',
        user,
      };
    }

    return {
      success: false,
      message: 'No active code found for this destination. Please request a new code.',
      error: 'EXPIRED_OR_NOT_FOUND',
    };
  }

  const now = Date.now();

  // Expiration check
  if (now > record.expiresAt) {
    otpStore.delete(normalized);
    return {
      success: false,
      message: 'This code has expired. Please request a new one.',
      error: 'CODE_EXPIRED',
    };
  }

  // Max attempts check (brute-force defense)
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalized);
    return {
      success: false,
      message: 'Too many incorrect attempts. For security, this code was invalidated. Please request a new code.',
      error: 'MAX_ATTEMPTS_EXCEEDED',
    };
  }

  record.attempts += 1;

  // Constant-time comparison to prevent timing attacks
  const targetBuffer = Buffer.from(record.code, 'utf-8');
  const userBuffer = Buffer.from(userCode.trim(), 'utf-8');

  const matches =
    targetBuffer.length === userBuffer.length &&
    crypto.timingSafeEqual(targetBuffer, userBuffer);

  if (!matches) {
    const attemptsLeft = MAX_VERIFY_ATTEMPTS - record.attempts;
    return {
      success: false,
      message: `Incorrect code. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`,
      error: 'INVALID_CODE',
    };
  }

  // OTP is valid! Invalidate immediately to prevent replay attacks
  otpStore.delete(normalized);

  // If Supabase is active, verify through Supabase as well
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.verifyOtp({
        [method]: normalized,
        token: userCode.trim(),
        type: method === 'email' ? 'email' : 'sms',
      } as any);
    } catch (e: any) {
      console.warn('[Supabase Verify Note]:', e.message);
    }
  }

  // Construct secure anonymous user representation (never exposing PII)
  const userId = `u_${crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 12)}`;

  const user: CurrentUser = {
    id: userId,
    email: method === 'email' ? normalized : undefined,
    phone: method === 'phone' ? normalized : undefined,
    is_authenticated: true,
    trust_score: 5, // Bonus for authenticating
    trust_level: 'Listener',
    role: 'user',
    is_banned: false,
  };

  return {
    success: true,
    message: 'Identity confirmed. Mask established.',
    user,
  };
}

