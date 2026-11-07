'use client';

import React, { useState } from 'react';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { X, Mail, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [method, setMethod] = useState<'email' | 'phone' | 'google'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    soundEngine.playClick();

    if (!identifier.trim()) {
      setError('Please enter an email or phone number.');
      return;
    }

    if (method === 'phone') {
      const cleanPhone = identifier.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit phone number.');
        return;
      }
    } else if (method === 'email') {
      if (!identifier.includes('@') || !identifier.includes('.')) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    soundEngine.playClick();

    if (otpCode.length < 4) {
      setError('Please enter the 4-digit code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const currentUser = communityStore.getCurrentUser();
      currentUser.email = method === 'email' ? identifier.trim() : undefined;
      currentUser.trust_score += 5;
      communityStore.saveCurrentUser(currentUser);

      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('input');
        setOtpCode('');
      }, 1400);
    }, 600);
  };

  const handleGoogleAuth = () => {
    soundEngine.playClick();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const currentUser = communityStore.getCurrentUser();
      currentUser.email = 'verified_user@wishfor.internal';
      currentUser.trust_score += 5;
      communityStore.saveCurrentUser(currentUser);

      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('input');
      }, 1400);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md border border-[rgba(233,236,238,0.12)] bg-[#13151f] p-7 text-[#e9ecee] shadow-2xl">
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 text-[#8ea3b5] hover:text-white p-1 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {step === 'success' ? (
          <div className="py-8 text-center space-y-3 font-sans">
            <CheckCircle2 size={32} className="mx-auto text-[#e5ab37]" />
            <h3 className="text-base text-white font-medium">
              You are signed in
            </h3>
            <p className="text-xs text-[#aab9c7] max-w-xs mx-auto leading-relaxed">
              Your trust score is now saved. Remember, your real identity is never exposed or linked to your posts.
            </p>
          </div>
        ) : step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-xs text-[#e5ab37] font-medium">
              Enter verification code
            </div>

            <h2 className="font-serif text-xl font-normal text-white">
              Check your message
            </h2>
            <p className="text-xs text-[#aab9c7] font-sans">
              Enter the code sent to {identifier}. (For demo, type any 4 digits, e.g. 1234)
            </p>

            {error && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • •"
                className="w-full text-center tracking-[0.5em] text-lg font-mono border border-[rgba(233,236,238,0.12)] bg-[#0e1017] px-3.5 py-2.5 text-white placeholder-[#8ea3b5] focus:border-[#e5ab37] focus:outline-none"
                autoFocus
              />
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-[#8ea3b5] hover:text-white underline"
              >
                Use a different contact
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-[rgba(233,236,238,0.25)] hover:border-white text-xs font-medium text-white transition-all disabled:opacity-40"
              >
                {isLoading ? 'Verifying...' : 'Verify & continue'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="text-xs text-[#e5ab37] font-medium">
              Private Sign In • 100% Anonymous
            </div>

            <h2 className="font-serif text-2xl font-normal text-white">
              Save your trust standing
            </h2>
            <p className="text-xs text-[#aab9c7] font-sans leading-relaxed">
              Your contact info is used only to send a login code and prevent spam. It is never displayed anywhere or linked to the masks you wear in threads.
            </p>

            {error && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Method selection */}
            <div className="flex border border-[rgba(233,236,238,0.1)] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMethod('email');
                  setIdentifier('');
                }}
                className={`flex-1 py-1.5 transition-colors ${
                  method === 'email'
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-[#8ea3b5] hover:text-white'
                }`}
              >
                Email
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMethod('phone');
                  setIdentifier('');
                }}
                className={`flex-1 py-1.5 transition-colors ${
                  method === 'phone'
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-[#8ea3b5] hover:text-white'
                }`}
              >
                Phone
              </button>
            </div>

            {/* Input field */}
            <div>
              <label className="block text-xs text-[#8ea3b5] font-medium mb-1">
                {method === 'email' ? 'Email address' : 'Phone number (10 digits)'}
              </label>
              <input
                type={method === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={method === 'email' ? 'you@domain.com' : '+1 555 019 2831'}
                className="w-full border border-[rgba(233,236,238,0.12)] bg-[#0e1017] px-3.5 py-2 text-sm text-[#e9ecee] placeholder-[#8ea3b5] focus:border-[#e5ab37] focus:outline-none transition-colors font-sans"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier.trim()}
              className="w-full py-2 border border-[rgba(233,236,238,0.25)] hover:border-white text-xs font-medium text-white transition-all disabled:opacity-40"
            >
              {isLoading ? 'Sending code...' : 'Send one-time code'}
            </button>

            <div className="relative py-1 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(233,236,238,0.08)]" />
              </div>
              <span className="relative bg-[#13151f] px-2 text-xs text-[#8ea3b5]">
                or
              </span>
            </div>

            {/* Google Anonymous Login */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2 border border-[rgba(233,236,238,0.12)] hover:border-white text-xs font-sans text-[#aab9c7] hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue with Google</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
