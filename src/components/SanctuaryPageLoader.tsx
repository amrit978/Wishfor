'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function SanctuaryPageLoader() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 1. Detect if this visit is a browser page reload/refresh
    let isReload = false;
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries && navEntries.length > 0) {
        isReload = navEntries[0].type === 'reload';
      } else if (typeof window !== 'undefined' && (window.performance as any)?.navigation?.type === 1) {
        isReload = true;
      }
    } catch {
      // Safe fallback
    }

    // 2. If the user refreshed on any subpage, redirect back to home page
    if (isReload && window.location.pathname !== '/') {
      try {
        window.history.replaceState(null, '', '/');
        router.replace('/');
      } catch {
        window.location.replace('/');
      }
    }

    // 3. Keep loading animation visible gracefully (850ms), then smoothly fade out
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 850);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1350);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [router]);

  if (!isVisible) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0d14] text-[#f2f2f5] select-none transition-opacity duration-500 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft Ambient Radial Atmosphere Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#1b2344]/35 via-[#23356e]/20 to-transparent blur-3xl animate-aura-glow" />
      </div>

      {/* Main Loader Content Frame */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md animate-gentle-breath">
        {/* Emblem with Orbital Dashed Ring */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Orbital Rotating Dashed Ring */}
          <div className="absolute -inset-4 w-[84px] h-[84px] rounded-full border border-dashed border-white/15 animate-orbit-rotate pointer-events-none" />

          {/* Secondary Soft Pulse Ring */}
          <div className="absolute -inset-2 w-[68px] h-[68px] rounded-2xl bg-white/[0.02] border border-white/10 animate-aura-glow pointer-events-none" />

          {/* Modern Geometric 'W' Emblem Chassis */}
          <div className="relative w-[52px] h-[52px] rounded-[13px] border border-white/25 bg-[#13151f]/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_24px_rgba(255,255,255,0.06)]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 20 20"
              fill="none"
              className="text-[#f2f2f5]"
            >
              <path
                d="M3.5 5.5 L7.2 14.5 L10 8 L12.8 14.5 L16.5 5.5"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Brand Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse" />
          <span className="font-sans text-[11px] uppercase tracking-[0.26em] text-[#7c8299] font-medium">
            WISHFOR // SANCTUARY
          </span>
        </div>

        {/* Editorial Title */}
        <h2 className="font-serif text-[22px] sm:text-[24px] font-normal tracking-tight text-[#f2f2f5] italic mb-5">
          Entering the sanctuary...
        </h2>

        {/* Fine Animated Beam Sweep Bar */}
        <div className="relative w-44 sm:w-52 h-[1.5px] bg-white/[0.08] rounded-full overflow-hidden mb-4">
          <div className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-[#e5ab37] to-transparent animate-beam-sweep" />
        </div>

        {/* Subtle Reassuring Subtitle */}
        <p className="font-sans text-[12px] text-[#7c8299] tracking-wide font-normal max-w-xs">
          A quiet room where everyone wears a mask.
        </p>
      </div>

      {/* Subtle Bottom Technical Telemetry */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <span className="text-[10px] tracking-[0.28em] uppercase text-[#7c8299]/50 font-mono">
          SECURE ENCRYPTED TRANSIT · ZERO TRACE
        </span>
      </div>
    </div>
  );
}

