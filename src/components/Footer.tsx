'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, ArrowUp, Lock, EyeOff, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative z-20 w-full border-t border-[rgba(255,255,255,0.10)] bg-[#090a10] text-[#aab0c4] text-xs font-sans">
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Main Footer Container */}
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 pt-16 sm:pt-20 pb-28 sm:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Brand & Ethos Column (5 cols on md/lg) */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border border-white/20 flex items-center justify-center font-serif text-[15px] text-[#f2f2f5] font-medium bg-white/[0.03]">
                W
              </div>
              <span className="font-serif text-[18px] text-[#f2f2f5] tracking-wide">
                WISH FOR
              </span>
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                SANCTUARY
              </span>
            </div>

            <p className="text-[14px] leading-[1.75] text-[#8e95ad] max-w-[420px]">
              An anonymous peer sanctuary built for the honest thoughts you cannot put your real name next to. 
              Protected by rotating pseudonym masks and zero identity tracking.
            </p>

            {/* Privacy Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono uppercase tracking-[0.15em] text-[#7c8299]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-white/10 bg-white/[0.02]">
                <EyeOff size={11} className="text-[#e5ab37]" />
                Zero Identity Exposure
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-white/10 bg-white/[0.02]">
                <Lock size={11} className="text-emerald-400" />
                Ephemeral Masks
              </span>
            </div>
          </div>

          {/* Column 2: Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#f2f2f5]">
              Sanctuary
            </div>
            <ul className="space-y-3 text-[13px]">
              <li>
                <Link
                  href="/"
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>The Room</span>
                  <span className="text-[#7c8299] text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    01 →
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/problems"
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>All Confessions</span>
                  <span className="text-[#7c8299] text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    02 →
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/share"
                  className="text-[#e5ab37] hover:text-amber-200 transition-colors flex items-center justify-between group"
                >
                  <span>+ Express Burden</span>
                  <span className="text-[#e5ab37] text-[10px] font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                    03 →
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/my-space"
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>My Space</span>
                  <span className="text-[#7c8299] text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    04 →
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/auth"
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Sign In with Email</span>
                  <span className="text-[#7c8299] text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    OTP →
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Safety (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#f2f2f5]">
              Protocol & Safety
            </div>
            <ul className="space-y-3 text-[13px]">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About the Sanctuary
                </Link>
              </li>
              <li>
                <Link
                  href="/guidelines"
                  className="hover:text-white transition-colors"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/moderation"
                  className="hover:text-white transition-colors"
                >
                  Moderation & Review Panel
                </Link>
              </li>
            </ul>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#7c8299]">
                Peer Support Notice
              </div>
              <p className="text-[12px] leading-relaxed text-[#7c8299]">
                Advice shared here comes from compassionate peers, not medical or mental health professionals. If you are experiencing an acute crisis, please reach out to trusted emergency helplines.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 pt-8 border-t border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Copyright & Core Disclaimers */}
          <div className="space-y-1">
            <div className="text-[12px] text-[#f2f2f5] flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>&copy; {currentYear} WishFor Sanctuary. All rights reserved.</span>
              <span className="text-white/20 hidden sm:inline">&bull;</span>
              <span className="text-[#7c8299]">Zero data sales &bull; No tracking cookies</span>
            </div>
            <p className="text-[11px] text-[#656c82]">
              Created for quiet honesty, respectful perspective, and communal healing.
            </p>
          </div>

          {/* System Status & Scroll to top */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sanctuary Operational</span>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/15 hover:border-white/40 text-[11px] uppercase tracking-[0.16em] text-[#aab0c4] hover:text-white transition-colors rounded-[2px]"
              title="Scroll smoothly back to the top"
            >
              <span>TOP</span>
              <ArrowUp size={12} />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
};
