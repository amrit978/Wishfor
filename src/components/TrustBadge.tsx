'use client';

import React from 'react';
import { TrustLevel } from '@/types';
import { getTrustBadgeDetails } from '@/lib/anonymity';

interface TrustBadgeProps {
  level: TrustLevel;
  className?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ level, className = '' }) => {
  const details = getTrustBadgeDetails(level);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border font-sans text-[11px] tracking-normal select-none transition-colors ${details.color} ${className}`}
      title={`Community standing: ${details.label} (Earned by offering genuine, helpful advice)`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${details.dot}`} />
      <span className="font-medium text-[#e9ecee]">{details.label}</span>
    </span>
  );
};
