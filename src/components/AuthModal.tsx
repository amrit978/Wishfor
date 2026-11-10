'use client';

import React, { useState, useEffect } from 'react';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { X, CheckCircle2, RotateCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function maskEmail(email: string): string {
  if (!email) return '';
  const parts = email.trim().split('@');
  if (parts.length < 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}*`;
  return `${maskedName}@${domain}`;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [ticket, setTicket] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

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
        setError(data.message || data.error || 'Failed to dispatch verification code.');
        if (data.waitSeconds) setResendCooldown(data.waitSeconds);
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
      setError('Could not connect to verification server.');
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
        setError(data.message || data.error || 'Failed to resend code.');
        if (data.waitSeconds) setResendCooldown(data.waitSeconds);
        setIsLoading(false);
        return;
      }

      if (data.ticket) {
        setTicket(data.ticket);
      }
      setResendCooldown(data.waitSeconds || 25);
      setInfoMessage('A fresh verification code has been dispatched.');
    } catch {
      setError('Could not connect to server.');
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
        setError(data.message || data.error || 'Invalid code. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        communityStore.saveCurrentUser(data.user);
      }
      soundEngine.playResonance();
      setStep('success');

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        setStep('input');
        setOtpCode('');
      }, 1000);
    } catch {
      setError('Verification network error.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md border border-[rgba(255,255,255,0.18)] bg-[#0c0d14] p-7 text-[#f2f2f5] shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#7c8299] hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#7c8299] font-medium mb-1">
            SANCTUARY IDENTITY
          </div>
          <h2 className="font-serif text-[26px] text-[#f2f2f5] font-normal">
            Enter Anonymously
          </h2>
          <p className="font-sans text-[13px] text-[#aab0c4] mt-1 leading-relaxed">
            Verify via email to preserve your trust badges. No real details are ever shown publicly.
          </p>
        </div>

        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#7c8299]">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="input-underlined w-full text-[16px]"
                autoFocus
                required
              />
            </div>

            {error && <p className="text-[12px] text-[#e2869a] font-sans">{error}</p>}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="btn-outline !h-[44px] !px-6 text-[11px] disabled:opacity-40"
              >
                {isLoading ? 'SENDING...' : 'SEND OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  communityStore.getCurrentUser();
                  onClose();
                  if (onSuccess) onSuccess();
                }}
                className="text-[11px] uppercase tracking-[0.18em] text-[#7c8299] hover:text-white"
              >
                GUEST ACCESS →
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#7c8299] flex items-center justify-between">
                <span>6-DIGIT CODE SENT TO:</span>
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
                className="input-underlined w-full text-[24px] tracking-[0.5em] font-mono text-center"
                autoFocus
                required
              />
            </div>

            {infoMessage && <p className="text-[12px] text-[#7ec89f] font-sans">{infoMessage}</p>}
            {error && <p className="text-[12px] text-[#e2869a] font-sans">{error}</p>}

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="btn-outline !h-[44px] !px-7 text-[11px] disabled:opacity-40"
                >
                  {isLoading ? 'VERIFYING...' : 'CONFIRM'}
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-[11px] text-[#7c8299] flex items-center gap-1.5 font-sans">
                    <RotateCw size={11} className="animate-spin text-[#7c8299]/60" />
                    <span>Resend in {resendCooldown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="btn-outline !h-[44px] !px-4 text-[10px]"
                  >
                    RESEND OTP
                  </button>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setOtpCode('');
                    setError(null);
                  }}
                  className="text-[11px] uppercase tracking-wider text-[#7c8299] hover:text-white"
                >
                  ← Change Email
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-[#7ec89f]" />
            <h3 className="font-serif text-[22px] text-[#f2f2f5]">Mask Established</h3>
            <p className="font-sans text-[13px] text-[#aab0c4]">Entering the room...</p>
          </div>
        )}
      </div>
    </div>
  );
};
