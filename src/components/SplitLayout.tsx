'use client';

import React from 'react';

interface SplitLayoutProps {
  children: React.ReactNode;
  glowColor?: string; // hex or rgb for category glow
  eyebrow?: string;
  title?: string | React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  children,
  glowColor = 'rgba(56, 120, 220, 0.28)', // default soft blue radial glow
  eyebrow,
  title,
  className = '',
  contentClassName = '',
}) => {
  return (
    <div className={`min-h-screen w-full relative bg-[#0c0d14] text-[#f2f2f5] ${className}`}>
      {/* 
        Left Decorative Textured Navy Panel:
        Desktop: 38% width, fixed on left, border-r 1px rgba(255,255,255,0.10).
        Mobile: collapses to 120px tall top strip with border-b.
      */}
      <div
        className="
          hidden md:block fixed top-0 left-0 w-[38%] h-full 
          bg-[#141a33] border-r border-[rgba(255,255,255,0.10)] 
          pointer-events-none z-0 overflow-hidden
        "
        aria-hidden="true"
      >
        {/* Soft category / ambient glow */}
        <div
          className="absolute w-[440px] h-[440px] rounded-full blur-[110px] pointer-events-none transition-colors duration-700 -translate-x-1/4 translate-y-1/3"
          style={{
            background: glowColor.startsWith('#') || glowColor.startsWith('rgb')
              ? glowColor
              : 'rgba(56, 120, 220, 0.28)',
            opacity: 0.35,
          }}
        />
        {/* Subtle decorative fine lines resembling horizon / lens */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(12,13,20,0.4)_100%)]" />
      </div>

      {/* Mobile Top Strip (120px) */}
      <div
        className="
          md:hidden w-full h-[120px] bg-[#141a33] 
          border-b border-[rgba(255,255,255,0.10)] 
          relative overflow-hidden pointer-events-none
        "
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 blur-[70px] opacity-30"
          style={{
            background: glowColor.startsWith('#') || glowColor.startsWith('rgb')
              ? glowColor
              : 'rgba(56, 120, 220, 0.28)',
          }}
        />
      </div>

      {/* Right Content Column */}
      <main
        className={`
          relative z-10 w-full min-h-screen 
          md:pl-[38%] 
          ${contentClassName}
        `}
      >
        <div className="w-full max-w-[780px] px-6 sm:px-12 md:pl-[88px] md:pr-12 pt-[130px] sm:pt-[170px] md:pt-[185px] pb-32 page-fade-drift">
          {eyebrow && (
            <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299] mb-4">
              {eyebrow}
            </div>
          )}

          {title && (
            <h1 className="font-serif text-[38px] sm:text-[48px] md:text-[52px] font-normal text-[#f2f2f5] leading-[1.02] tracking-[-0.015em] mb-8">
              {title}
            </h1>
          )}

          {children}
        </div>
      </main>
    </div>
  );
};

