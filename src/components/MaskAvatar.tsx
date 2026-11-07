'use client';

import React from 'react';

interface MaskAvatarProps {
  name: string;
  seed: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isAsker?: boolean;
}

export const MaskAvatar: React.FC<MaskAvatarProps> = ({
  name,
  seed,
  size = 'md',
  className = '',
  isAsker = false,
}) => {
  const parts = seed.split('-');
  const variant = parseInt(parts[0] || '0', 10) % 5;
  const numCode = parseInt(parts[1] || '101', 10);

  const dim = size === 'sm' ? 24 : size === 'md' ? 36 : size === 'lg' ? 44 : 56;
  const strokeColor = isAsker ? '#e5ab37' : '#71717a';
  const glowColor = isAsker ? 'rgba(229, 171, 55, 0.25)' : 'rgba(113, 113, 122, 0.1)';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 border select-none transition-all duration-200 group-hover:border-amber-400/60 ${
        isAsker
          ? 'border-amber-500/50 bg-[#12141c]'
          : 'border-zinc-800 bg-[#0c0d12]'
      } ${className}`}
      style={{
        width: dim,
        height: dim,
        boxShadow: `0 0 12px ${glowColor}`,
      }}
      title={`${name} ${isAsker ? '[TRANSMISSION SOURCE // ASKER]' : '[PEER NODE]'}`}
    >
      {/* Corner crosshairs */}
      <span className="absolute -top-1 -left-1 text-[8px] text-zinc-600 font-mono leading-none select-none pointer-events-none">
        +
      </span>
      <span className="absolute -bottom-1 -right-1 text-[8px] text-zinc-600 font-mono leading-none select-none pointer-events-none">
        +
      </span>

      <svg
        viewBox="0 0 40 40"
        width={dim - 8}
        height={dim - 8}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-105"
      >
        {variant === 0 && (
          // Concentric Radar & Coordinate Reticle
          <>
            <circle cx="20" cy="20" r="14" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="20" cy="20" r="8" stroke={strokeColor} strokeWidth="1.2" />
            <line x1="20" y1="4" x2="20" y2="36" stroke={strokeColor} strokeWidth="0.8" opacity="0.4" />
            <line x1="4" y1="20" x2="36" y2="20" stroke={strokeColor} strokeWidth="0.8" opacity="0.4" />
            <circle cx="20" cy="20" r="2.5" fill={strokeColor} />
          </>
        )}

        {variant === 1 && (
          // Diamond Wave Matrix
          <>
            <rect x="7" y="7" width="26" height="26" stroke={strokeColor} strokeWidth="1" transform="rotate(45 20 20)" opacity="0.6" />
            <polygon points="20,10 30,20 20,30 10,20" stroke={strokeColor} strokeWidth="1.2" />
            <circle cx="20" cy="20" r="3" fill={strokeColor} />
            <line x1="14" y1="20" x2="26" y2="20" stroke={strokeColor} strokeWidth="1" />
          </>
        )}

        {variant === 2 && (
          // Audio Sine Frequency Nodes
          <>
            <circle cx="20" cy="20" r="15" stroke={strokeColor} strokeWidth="0.8" opacity="0.4" />
            <path d="M7 20 Q13 11 20 20 T33 20" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="13" cy="15" r="2" fill={strokeColor} />
            <circle cx="27" cy="25" r="2" fill={strokeColor} />
            <circle cx="20" cy="20" r="2.5" fill={strokeColor} />
          </>
        )}

        {variant === 3 && (
          // Telemetry Gyroscope
          <>
            <circle cx="20" cy="20" r="14" stroke={strokeColor} strokeWidth="1.2" />
            <ellipse cx="20" cy="20" rx="14" ry="6" stroke={strokeColor} strokeWidth="0.8" transform="rotate(30 20 20)" opacity="0.7" />
            <ellipse cx="20" cy="20" rx="14" ry="6" stroke={strokeColor} strokeWidth="0.8" transform="rotate(-30 20 20)" opacity="0.7" />
            <circle cx="20" cy="20" r="2" fill={strokeColor} />
          </>
        )}

        {variant === 4 && (
          // Hexagonal Sound Chamber
          <>
            <polygon points="20,6 32,13 32,27 20,34 8,27 8,13" stroke={strokeColor} strokeWidth="1.2" />
            <polygon points="20,12 27,16 27,24 20,28 13,24 13,16" stroke={strokeColor} strokeWidth="0.8" opacity="0.6" />
            <circle cx="20" cy="20" r="2.5" fill={strokeColor} />
          </>
        )}
      </svg>

      {/* Asker signal dot indicator */}
      {isAsker && (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 ring-2 ring-[#0c0d12]"
          title="Transmission Asker"
        />
      )}
    </div>
  );
};
