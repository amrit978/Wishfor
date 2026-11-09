'use client';

import React, { useState, useEffect, useRef } from 'react';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { COUNTRIES, DEFAULT_COUNTRY, CountryCode } from '@/lib/countryCodes';
import { X, CheckCircle2, RotateCw, ChevronDown, Search } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
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

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    soundEngine.playClick();

    let targetIdentifier = '';
    if (method === 'email') {
      targetIdentifier = identifier.trim();
      if (!targetIdentifier) {
        setError('Please enter your email.');
        return;
      }
    } else {
      const cleanDigits = phoneNumber.trim().replace(/\D/g, '');
      if (!cleanDigits) {
        setError('Please enter your phone number.');
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
        setError(data.message || data.error || 'Failed to dispatch verification code.');
        if (data.waitSeconds) setResendCooldown(data.waitSeconds);
        setIsLoading(false);
        return;
      }

      setStep('otp');
      setResendCooldown(data.waitSeconds || 60);
      setInfoMessage(data.message);
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

    const targetIdentifier = identifier.trim() || (method === 'email' ? identifier.trim() : `${selectedCountry.dial_code}${phoneNumber.trim()}`);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetIdentifier, method }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Failed to resend code.');
        if (data.waitSeconds) setResendCooldown(data.waitSeconds);
        setIsLoading(false);
        return;
      }

      setResendCooldown(data.waitSeconds || 60);
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
        body: JSON.stringify({ identifier: identifier.trim(), method, code: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Invalid code.');
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
            Verify via email or SMS to preserve your trust badges. No real details are ever shown publicly.
          </p>
        </div>

        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMethod('email');
                  setIdentifier('');
                  setError(null);
                }}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border rounded-[2px] transition-colors ${
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
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border rounded-[2px] transition-colors ${
                  method === 'phone'
                    ? 'border-white text-white bg-white/5'
                    : 'border-white/20 text-[#7c8299] hover:text-white'
                }`}
              >
                PHONE OTP
              </button>
            </div>

            {method === 'email' ? (
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-[#7c8299]">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@domain.com"
                  className="input-underlined w-full text-[16px]"
                  autoFocus
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-[0.2em] text-[#7c8299]">
                  MOBILE NUMBER WITH COUNTRY CODE
                </label>
                <div className="flex items-end gap-2.5 pt-1">
                  {/* Country Selector Dropdown */}
                  <div className="relative shrink-0" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className="h-[42px] pb-1 px-1 border-b border-white/20 hover:border-white/60 flex items-center gap-1.5 text-[15px] font-mono text-[#f2f2f5] transition-colors focus:outline-none"
                    >
                      <span className="text-[17px]">{selectedCountry.flag}</span>
                      <span className="font-semibold text-[14px]">{selectedCountry.dial_code}</span>
                      <ChevronDown
                        size={13}
                        className={`text-[#7c8299] transition-transform duration-200 ${
                          countryDropdownOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </button>

                    {countryDropdownOpen && (
                      <div className="absolute left-0 bottom-[50px] sm:bottom-auto sm:top-[46px] w-64 max-h-64 overflow-y-auto bg-[#0c0d14]/98 border border-[rgba(255,255,255,0.18)] backdrop-blur-md shadow-2xl z-50 p-2 space-y-1">
                        <div className="p-1 mb-1 border-b border-white/10 sticky top-0 bg-[#0c0d14] z-10 flex items-center gap-1.5">
                          <Search size={12} className="text-[#7c8299]" />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-transparent text-xs text-white placeholder-[#7c8299] focus:outline-none py-0.5"
                            autoFocus
                          />
                        </div>

                        {filteredCountries.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setCountryDropdownOpen(false);
                              setCountrySearch('');
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 text-xs text-left hover:bg-white/5 transition-colors rounded-[2px] ${
                              selectedCountry.code === c.code ? 'bg-white/10 text-[#f2f2f5]' : 'text-[#aab0c4]'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span>{c.flag}</span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="font-mono text-[#e5ab37] text-[11px] shrink-0 ml-1">
                              {c.dial_code}
                            </span>
                          </button>
                        ))}
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
                      className="input-underlined w-full text-[17px] font-mono tracking-wider"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-[12px] text-[#e2869a] font-sans">{error}</p>}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading || (method === 'email' ? !identifier.trim() : !phoneNumber.trim())}
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
                  {maskIdentifier(identifier, method)}
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
                  ← Change {method}
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
