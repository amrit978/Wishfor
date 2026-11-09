'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { SplitLayout } from '@/components/SplitLayout';
import { COUNTRIES, DEFAULT_COUNTRY, CountryCode } from '@/lib/countryCodes';
import { CheckCircle2, RotateCw, ChevronDown, Search } from 'lucide-react';

function maskIdentifier(val: string, method: 'email' | 'phone'): string {
  if (!val) return '';
  if (method === 'email') {
    const parts = val.trim().split('@');
    if (parts.length < 2) return val;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}*`;
    return `${maskedName}@${domain}`;
  }
  const digits = val.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+${digits.slice(0, digits.length - 8)}******${digits.slice(-4)}`;
  }
  return val;
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/my-space';

  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    if (countryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [countryDropdownOpen]);

  // Active countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial_code.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    soundEngine.playClick();

    let targetIdentifier = '';
    if (method === 'email') {
      targetIdentifier = identifier.trim();
      if (!targetIdentifier) {
        setError('Please enter your email address.');
        return;
      }
    } else {
      const cleanDigits = phoneNumber.trim().replace(/\D/g, '');
      if (!cleanDigits) {
        setError('Please enter your mobile phone number.');
        return;
      }
      targetIdentifier = `${selectedCountry.dial_code}${cleanDigits}`;
    }

    setIdentifier(targetIdentifier);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetIdentifier, method }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Failed to dispatch verification code. Please check your input.');
        if (data.waitSeconds) {
          setResendCooldown(data.waitSeconds);
        }
        setIsLoading(false);
        return;
      }

      setStep('otp');
      setResendCooldown(data.waitSeconds || 60);
      setInfoMessage(data.message);
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

    const targetIdentifier = identifier.trim() || (method === 'email' ? identifier.trim() : `${selectedCountry.dial_code}${phoneNumber.trim()}`);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetIdentifier, method }),
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

      setResendCooldown(data.waitSeconds || 60);
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
        body: JSON.stringify({ identifier: identifier.trim(), method, code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Verification failed. Please try again.');
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
    // Instantiates an anonymous guest session in local store
    communityStore.getCurrentUser();
    router.push(redirect);
  };

  return (
    <SplitLayout eyebrow="IDENTITY" title="Enter The Sanctuary">
      <div className="space-y-10 max-w-[520px]">
        
        <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
          Sign in to preserve your trust badges and view your private corner across devices. Your real email or phone is never exposed to anyone in public transmissions.
        </p>

        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-8">
            {/* Method Toggle: Outline pills */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMethod('email');
                  setIdentifier('');
                  setError(null);
                }}
                className={`px-4 py-2 text-[11px] uppercase tracking-[0.2em] border rounded-[2px] transition-colors ${
                  method === 'email'
                    ? 'border-white text-white bg-white/5'
                    : 'border-white/20 text-[#7c8299] hover:text-white'
                }`}
              >
                EMAIL
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod('phone');
                  setIdentifier('');
                  setError(null);
                }}
                className={`px-4 py-2 text-[11px] uppercase tracking-[0.2em] border rounded-[2px] transition-colors ${
                  method === 'phone'
                    ? 'border-white text-white bg-white/5'
                    : 'border-white/20 text-[#7c8299] hover:text-white'
                }`}
              >
                PHONE OTP
              </button>
            </div>

            <div key={method} className="tab-pane-transition">
              {method === 'email' ? (
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-[0.22em] text-[#7c8299]">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@domain.com"
                    className="input-underlined w-full text-[17px]"
                    autoFocus
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-[0.22em] text-[#7c8299]">
                    MOBILE NUMBER WITH COUNTRY CODE
                  </label>
                  <div className="flex items-end gap-3 pt-1">
                    {/* Country Selector Dropdown */}
                    <div className="relative shrink-0" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                        className="h-[46px] pb-2 px-1 border-b border-white/20 hover:border-white/60 flex items-center gap-2 text-[16px] font-mono text-[#f2f2f5] transition-colors focus:outline-none"
                        title="Select country code"
                      >
                        <span className="text-[19px]">{selectedCountry.flag}</span>
                        <span className="font-semibold text-[16px]">{selectedCountry.dial_code}</span>
                        <ChevronDown
                          size={14}
                          className={`text-[#7c8299] transition-transform duration-200 ${
                            countryDropdownOpen ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </button>

                      {countryDropdownOpen && (
                        <div className="absolute left-0 bottom-[54px] sm:bottom-auto sm:top-[50px] w-72 max-h-72 overflow-y-auto bg-[#0c0d14]/98 border border-[rgba(255,255,255,0.18)] backdrop-blur-md shadow-2xl z-50 p-2 space-y-1 page-fade-drift">
                          <div className="p-1 mb-1 border-b border-white/10 sticky top-0 bg-[#0c0d14] z-10 flex items-center gap-2">
                            <Search size={12} className="text-[#7c8299]" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search country or code..."
                              className="w-full bg-transparent text-xs text-white placeholder-[#7c8299] focus:outline-none py-1"
                              autoFocus
                            />
                          </div>

                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setCountryDropdownOpen(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs text-left hover:bg-white/5 transition-colors rounded-[2px] ${
                                  selectedCountry.code === c.code ? 'bg-white/10 text-[#f2f2f5]' : 'text-[#aab0c4]'
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span className="text-[15px]">{c.flag}</span>
                                  <span className="truncate">{c.name}</span>
                                </span>
                                <span className="font-mono text-[#e5ab37] text-[11px] shrink-0 ml-2">
                                  {c.dial_code}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-[#7c8299]">
                              No country matched
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Phone input */}
                    <div className="flex-1">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                        placeholder="9263331501"
                        className="input-underlined w-full text-[20px] font-mono tracking-wider"
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-[13px] text-[#e2869a] font-sans">{error}</p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isLoading || (method === 'email' ? !identifier.trim() : !phoneNumber.trim())}
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
                  {maskIdentifier(identifier, method)}
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

            {/* Actions: Confirm, Resend OTP & Change Number */}
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
                  ← CHANGE {method.toUpperCase()}
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
