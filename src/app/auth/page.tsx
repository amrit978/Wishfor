'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { SplitLayout } from '@/components/SplitLayout';
import { CheckCircle2, RotateCw } from 'lucide-react';

function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.trim().split('@');
  if (parts.length < 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}*`;
  return `${maskedName}@${domain}`;
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/my-space';

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [ticket, setTicket] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Active countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    soundEngine.playClick();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanEmail, method: 'email' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Failed to dispatch verification code. Please check your email.');
        if (data.waitSeconds) {
          setResendCooldown(data.waitSeconds);
        }
        setIsLoading(false);
        return;
      }

      if (data.ticket) {
        setTicket(data.ticket);
      }
      setStep('otp');
      setResendCooldown(data.waitSeconds || 25);
      setInfoMessage(data.message || 'Verification code sent to your inbox.');
    } catch {
      setError('Could not connect to the verification server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setError(null);
    setInfoMessage(null);
    soundEngine.playClick();
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanEmail, method: 'email' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Could not resend code. Please try again.');
        if (data.waitSeconds) {
          setResendCooldown(data.waitSeconds);
        }
        setIsLoading(false);
        return;
      }

      if (data.ticket) {
        setTicket(data.ticket);
      }
      setResendCooldown(data.waitSeconds || 25);
      setInfoMessage('A fresh verification code has been dispatched.');
    } catch {
      setError('Could not connect to server to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    soundEngine.playClick();

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email.trim().toLowerCase(),
          method: 'email',
          code: cleanCode,
          ticket,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Verification failed. Please check the code.');
        setIsLoading(false);
        return;
      }

      // Success: update community store
      if (data.user) {
        communityStore.saveCurrentUser(data.user);
      }
      soundEngine.playResonance();
      setStep('success');

      setTimeout(() => {
        router.push(redirect);
      }, 900);
    } catch {
      setError('Verification network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    soundEngine.playClick();
    communityStore.getCurrentUser();
    router.push(redirect);
  };

  return (
    <SplitLayout eyebrow="IDENTITY" title="Enter The Sanctuary">
      <div className="space-y-10 max-w-[520px]">
        <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
          Sign in to preserve your trust badges and view your private corner across devices. Your real email is never exposed to anyone in public transmissions.
        </p>

        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-[0.22em] text-[#7c8299]">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="input-underlined w-full text-[17px]"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-[13px] text-[#e2869a] font-sans">{error}</p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="btn-outline !h-[48px] !px-7 disabled:opacity-40"
              >
                {isLoading ? 'TRANSMITTING...' : 'SEND OTP CODE'}
              </button>

              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="text-[12px] uppercase tracking-[0.2em] text-[#7c8299] hover:text-[#f2f2f5] transition-colors text-left sm:text-right"
              >
                CONTINUE AS GUEST →
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-8">
            <div className="space-y-3">
              <div className="text-[12px] uppercase tracking-[0.2em] text-[#7c8299] flex items-center justify-between">
                <span>ENTER 6-DIGIT CODE SENT TO:</span>
                <span className="text-[#f2f2f5] font-mono lowercase">
                  {maskEmail(email)}
                </span>
              </div>

              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="input-underlined w-full text-[28px] tracking-[0.55em] font-mono text-center"
                autoFocus
                required
              />
            </div>

            {infoMessage && (
              <p className="text-[13px] text-[#7ec89f] font-sans">{infoMessage}</p>
            )}

            {error && (
              <p className="text-[13px] text-[#e2869a] font-sans">{error}</p>
            )}

            {/* Actions: Confirm, Resend OTP & Change Email */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="btn-outline !h-[48px] !px-8 disabled:opacity-40"
                >
                  {isLoading ? 'VERIFYING...' : 'CONFIRM & ENTER'}
                </button>

                {/* Resend OTP button with countdown timer */}
                {resendCooldown > 0 ? (
                  <span className="text-[12px] font-sans text-[#7c8299] flex items-center gap-1.5 py-2 px-1">
                    <RotateCw size={12} className="animate-spin text-[#7c8299]/60" />
                    <span>
                      Resend code in {Math.floor(resendCooldown / 60)}:
                      {(resendCooldown % 60).toString().padStart(2, '0')}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="btn-outline !h-[48px] !px-5 text-[11px]"
                  >
                    RESEND OTP
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setOtpCode('');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[12px] uppercase tracking-[0.18em] text-[#7c8299] hover:text-white transition-colors"
                >
                  ← CHANGE EMAIL
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="py-8 space-y-3">
            <div className="text-[12px] uppercase tracking-[0.22em] text-[#7ec89f] font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>MASK CONFIRMED</span>
            </div>
            <p className="font-serif text-[24px] text-[#f2f2f5]">
              Entering your personal corner...
            </p>
          </div>
        )}

        <div className="pt-8 border-t border-[rgba(255,255,255,0.10)] text-[13px] text-[#7c8299] leading-relaxed">
          Zero identity leakage. No marketing emails, no device fingerprinting, and no public profile pages.
        </div>
      </div>
    </SplitLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#13151f]" />}>
      <AuthContent />
    </Suspense>
  );
}
