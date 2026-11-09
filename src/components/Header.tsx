'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { soundEngine } from '@/lib/soundscape';
import { communityStore } from '@/lib/store';
import { CurrentUser } from '@/types';
import { ChevronDown, Volume2, VolumeX, Globe, LogOut, LogIn, ShieldAlert, User, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [user, setUser] = useState<CurrentUser | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const currentUser = communityStore.getCurrentUser();
    setUser(currentUser);

    // Sound persistence
    const savedSound = localStorage.getItem('wishfor_sound_pref');
    if (savedSound === 'on') {
      const state = soundEngine.toggleAmbient();
      setIsSoundOn(state);
    }

    const savedLang = localStorage.getItem('wishfor_lang_pref') as 'en' | 'hi';
    if (savedLang) {
      setLanguage(savedLang);
    }

    const unsub = communityStore.subscribe(() => {
      setUser(communityStore.getCurrentUser());
    });
    return () => unsub();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    soundEngine.playClick();
    communityStore.logout();
    setProfileOpen(false);
    setDropdownOpen(false);
    router.push('/my-space');
  };

  const toggleSound = () => {
    const nextState = soundEngine.toggleAmbient();
    setIsSoundOn(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishfor_sound_pref', nextState ? 'on' : 'off');
    }
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : 'en';
    setLanguage(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishfor_lang_pref', next);
    }
  };

  const navLinks = [
    { label: 'PROBLEMS', href: '/problems' },
    { label: 'MY SPACE', href: '/my-space' },
    { label: 'ABOUT', href: '/about' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none select-none bg-gradient-to-b from-[#13151f]/95 via-[#13151f]/70 to-transparent">
      <div className="w-full h-[100px] sm:h-[140px] px-6 sm:px-[53px] flex items-center justify-between">
        
        {/* Left: Modern Architectural Tech Mark + Two-Tone Wordmark */}
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3.5 group cursor-pointer focus:outline-none"
          title="Return to The Room"
        >
          {/* Modern Geometric Monogram (Clean, architectural 'W' - zero religious/devotional motifs) */}
          <div className="w-[36px] h-[36px] rounded-[9px] border border-white/20 group-hover:border-white/60 bg-white/[0.03] group-hover:bg-white/[0.07] flex items-center justify-center transition-all duration-300 shrink-0 shadow-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-[#f2f2f5] group-hover:text-white transition-colors duration-300"
            >
              <path
                d="M3.5 5.5 L7.2 14.5 L10 8 L12.8 14.5 L16.5 5.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Two-tone wordmark: WISH in bold white, FOR in dim tracked uppercase */}
          <div className="flex items-baseline tracking-normal">
            <span className="font-sans font-bold text-[18px] text-[#f2f2f5] tracking-tight group-hover:text-white transition-colors duration-300">
              WISH
            </span>
            <span className="font-sans font-normal text-[14px] text-[#7c8299] tracking-[0.24em] ml-1.5 uppercase group-hover:text-[#aab0c4] transition-colors duration-300">
              FOR
            </span>
          </div>
        </Link>

        {/* Center: Three uppercase tracked text links with smooth underline glide */}
        <nav className="hidden md:flex items-center gap-10 pointer-events-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative py-1.5 text-[12px] uppercase font-medium tracking-[0.22em] transition-all duration-300 ease-out group/nav ${
                  isActive
                    ? 'text-[#f2f2f5] font-semibold'
                    : 'text-[#7c8299] hover:text-[#f2f2f5]'
                }`}
              >
                <span>{link.label}</span>
                {/* Smooth active underline pill */}
                <span
                  className={`absolute bottom-0 left-0 h-[1.5px] bg-[#f2f2f5] transition-all duration-300 ease-out ${
                    isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover/nav:w-1/2 group-hover/nav:opacity-40'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right: Action button & 34px Circular Outline Button holding Chevron */}
        <div className="flex items-center gap-4 pointer-events-auto sm:pr-[4px]">
          {mounted && (user?.is_authenticated || user?.email) ? (
            /* Profile Icon with Hover & Click Card */
            <div
              className="relative group"
              ref={profileRef}
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-[38px] h-[38px] rounded-full border border-[#7ec89f]/60 hover:border-[#7ec89f] bg-[#7ec89f]/10 flex items-center justify-center text-[#7ec89f] transition-all duration-200 focus:outline-none"
                aria-label="User profile and account menu"
                aria-expanded={profileOpen}
                title={user?.email || 'Your Sanctuary Profile'}
              >
                <User size={16} />
              </button>

              {/* Hover / Click Dropdown Card */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-3 w-72 border border-[rgba(255,255,255,0.14)] bg-[#0c0d14]/98 backdrop-blur-md p-4 text-xs shadow-2xl z-50 page-fade-drift"
                  onMouseEnter={() => setProfileOpen(true)}
                >
                  <div className="pb-3 border-b border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-medium text-[#7ec89f]">
                      <ShieldCheck size={12} />
                      <span>SANCTUARY CITIZEN</span>
                    </div>
                    <div className="font-mono text-[13px] text-white truncate" title={user?.email || ''}>
                      {user?.email || 'Logged In Member'}
                    </div>
                    <div className="text-[11px] text-[#7c8299] font-sans">
                      {user?.trust_level || 'Newcomer'} · {user?.trust_score || 0} trust pts
                    </div>
                  </div>

                  <div className="py-2 space-y-1 border-b border-white/10">
                    <Link
                      href="/my-space"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-[#aab0c4] hover:text-white hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.16em]"
                    >
                      <span>MY SPACE</span>
                      <span className="text-[10px] text-[#7c8299]">QUESTIONS & ADVICE →</span>
                    </Link>

                    <Link
                      href="/share"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-[#e5ab37] hover:text-white hover:bg-white/5 transition-colors text-[11px] uppercase tracking-[0.16em]"
                    >
                      <span>+ ASK QUESTION</span>
                      <span className="text-[10px] text-[#7c8299]">EXPRESS →</span>
                    </Link>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] uppercase tracking-[0.18em] text-[#e2869a] hover:text-rose-300 hover:bg-rose-950/20 transition-colors text-left"
                    >
                      <LogOut size={12} />
                      <span>LOGOUT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth?redirect=/share"
              className="btn-outline !h-[40px] !px-5 text-[11px] hidden sm:inline-flex"
            >
              EXPRESS
            </Link>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-[34px] h-[34px] rounded-full border border-white/30 hover:border-white/60 active:scale-95 flex items-center justify-center text-[#aab0c4] hover:text-white transition-all duration-200 focus:outline-none"
              aria-label="Preferences and navigation menu"
              aria-expanded={dropdownOpen}
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-250 ${dropdownOpen ? 'rotate-180 text-white' : ''}`}
              />
            </button>

          {/* Tiny Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 border border-[rgba(255,255,255,0.14)] bg-[#0c0d14]/98 backdrop-blur-md p-2 text-xs shadow-2xl z-50 page-fade-drift">
              
              {/* Mobile-only Nav Links */}
              <div className="md:hidden pb-2 mb-2 border-b border-white/10 space-y-1">
                <Link
                  href="/auth?redirect=/share"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[#e5ab37] hover:text-white hover:bg-white/5 transition-colors font-semibold"
                >
                  + EXPRESS YOURSELF
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setDropdownOpen(false)}
                    className="block px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[#aab0c4] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Sound on/off */}
              <button
                onClick={toggleSound}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[#aab0c4] hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  {isSoundOn ? <Volume2 size={13} className="text-[#e5ab37]" /> : <VolumeX size={13} />}
                  <span className="tracking-wide">Ambient Night Sound</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">
                  {isSoundOn ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[#aab0c4] hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Globe size={13} />
                  <span className="tracking-wide">Language</span>
                </span>
                <span className="text-[10px] font-mono tracking-wider text-[#e5ab37]">
                  {language === 'en' ? 'EN' : 'हिन्दी'}
                </span>
              </button>

              {/* Community Rules Link */}
              <Link
                href="/guidelines"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[#aab0c4] hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <span className="tracking-wide">Community Guidelines</span>
              </Link>

              {/* Moderator Switcher (if role is moderator or mounted) */}
              {mounted && user?.role === 'moderator' && (
                <Link
                  href="/moderation"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-purple-300 hover:text-white hover:bg-purple-950/30 transition-colors text-left border-t border-white/5"
                >
                  <ShieldAlert size={13} />
                  <span className="tracking-wide">Moderator Panel</span>
                </Link>
              )}

              {/* Profile / Verify Mask */}
              {mounted && (user?.email || user?.phone) ? (
                <Link
                  href="/my-space"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[#7ec89f] hover:text-white hover:bg-white/5 transition-colors text-left border-t border-white/5"
                >
                  <ShieldAlert size={13} className="text-[#7ec89f]" />
                  <span className="tracking-wide">My Profile (Verified)</span>
                </Link>
              ) : mounted ? (
                <Link
                  href="/auth?redirect=/my-space"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[#e5ab37] hover:text-white hover:bg-white/5 transition-colors text-left border-t border-white/5"
                >
                  <LogIn size={13} />
                  <span className="tracking-wide">Verify Identity (+5 Pts)</span>
                </Link>
              ) : null}

              {/* Logout Option */}
              {mounted && (user?.is_authenticated || user?.email) ? (
                <div className="pt-1 mt-1 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#e2869a] hover:text-rose-300 hover:bg-white/5 transition-colors text-left"
                  >
                    <LogOut size={12} />
                    <span>Log Out ({user?.email ? user.email.split('@')[0] : 'Citizen'})</span>
                  </button>
                </div>
              ) : (
                <div className="pt-1 mt-1 border-t border-white/10">
                  <Link
                    href="/auth?redirect=/my-space"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#e5ab37] hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <LogIn size={12} />
                    <span>Sign In to Sanctuary</span>
                  </Link>
                </div>
              )}

            </div>
          )}
          </div>
        </div>

      </div>
    </header>
  );
};
