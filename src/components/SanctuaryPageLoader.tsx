'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function SanctuaryPageLoader() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // 1. Detect if this visit was triggered by a browser reload/refresh
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

    // 2. On browser refresh, always redirect to the home room
    if (isReload && window.location.pathname !== '/') {
      try {
        window.history.replaceState(null, '', '/');
        router.replace('/');
      } catch {
        window.location.replace('/');
      }
    }

    // 3. Smooth 0% -> 100% counter running over ~1.6 seconds
    const startTime = performance.now();
    const duration = 1600; // 1.6s smooth runtime
    let frameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressFraction = Math.min(elapsed / duration, 1);

      // Smooth ease-out curve
      const eased = 1 - Math.pow(1 - progressFraction, 2.5);
      const percent = Math.min(Math.round(eased * 100), 100);

      setProgress(percent);

      if (progressFraction < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        // Reached 100% -> trigger smooth opening transition
        setTimeout(() => {
          setIsOpening(true);
          setTimeout(() => {
            setIsVisible(false);
          }, 750); // 750ms smooth curtain dissolve
        }, 180);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [router]);

  if (!isVisible) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0d14] text-[#f2f2f5] select-none transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
        isOpening
          ? 'opacity-0 scale-[1.03] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft Ambient Radial Atmosphere Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#1b2344]/35 via-[#23356e]/20 to-transparent blur-3xl animate-aura-glow" />
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
        {/* Modern Geometric 'W' Emblem Chassis */}
        <div className="w-[44px] h-[44px] rounded-[11px] border border-white/20 bg-[#13151f]/80 backdrop-blur-md flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(255,255,255,0.05)]">
          <svg
            width="22"
            height="22"
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

        {/* Wordmark */}
        <div className="flex items-baseline tracking-normal mb-8">
          <span className="font-sans font-bold text-[15px] text-[#f2f2f5] tracking-tight">
            WISH
          </span>
          <span className="font-sans font-normal text-[12px] text-[#7c8299] tracking-[0.24em] ml-1.5 uppercase">
            FOR
          </span>
        </div>

        {/* Prominent 0 to 100% Counter */}
        <div className="font-mono text-[44px] sm:text-[52px] font-light text-[#f2f2f5] tracking-tight leading-none mb-4 tabular-nums">
          {progress}
          <span className="text-[20px] sm:text-[24px] text-[#7c8299] font-normal ml-1">
            %
          </span>
        </div>

        {/* Minimalist Progress Line */}
        <div className="relative w-48 sm:w-56 h-[2px] bg-white/[0.08] rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-[#e5ab37] transition-[width] duration-75 ease-out rounded-full shadow-[0_0_8px_rgba(229,171,55,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Muted Subtitle */}
        <p className="font-sans text-[11px] tracking-[0.24em] uppercase text-[#7c8299] font-medium">
          Entering The Sanctuary
        </p>
      </div>

      {/* Subtle Bottom Technical Telemetry */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <span className="text-[10px] tracking-[0.28em] uppercase text-[#7c8299]/40 font-mono">
          SECURE ENCRYPTED TRANSIT · ZERO TRACE
        </span>
      </div>
    </div>
  );
}
