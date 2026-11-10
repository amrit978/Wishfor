'use client';

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 w-full border-t border-[rgba(255,255,255,0.08)] bg-[#090a10] text-[#aab0c4] text-xs font-sans">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-12 py-10 sm:py-12 text-center space-y-2">
        <div className="text-[13px] text-[#f2f2f5] flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          <span>&copy; 2026 WishFor Sanctuary. All rights reserved.</span>
          <span className="text-white/20">&bull;</span>
          <span className="text-[#8e95ad]">Zero data sales &bull; No tracking cookies</span>
        </div>
        <p className="text-[12px] text-[#656c82]">
          Created for quiet honesty, respectful perspective, and communal healing.
        </p>
      </div>
    </footer>
  );
};
