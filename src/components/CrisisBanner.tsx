'use client';

import React, { useState } from 'react';
import { CRISIS_HELPLINES } from '@/lib/safety';
import { PhoneCall, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface CrisisBannerProps {
  compact?: boolean;
}

export const CrisisBanner: React.FC<CrisisBannerProps> = ({ compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <div className="my-5 border border-[rgba(233,236,238,0.12)] bg-[#13151f] p-5 text-[#e9ecee] relative">
      {/* Corner crosshairs */}
      <span className="absolute -top-1.5 -left-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>
      <span className="absolute -top-1.5 -right-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>
      <span className="absolute -bottom-1.5 -left-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>
      <span className="absolute -bottom-1.5 -right-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e5ab37] animate-pulse" />
            <span className="text-xs font-sans font-medium text-[#e5ab37]">
              Free & Confidential 24/7 Helplines
            </span>
          </div>

          <h4 className="font-serif text-lg text-white font-normal tracking-wide">
            You don't have to carry this alone.
          </h4>
          <p className="text-xs text-[#aab9c7] leading-relaxed max-w-2xl font-sans">
            If you are feeling overwhelmed, having thoughts of hurting yourself, or just need someone kind to talk to, free counselors are standing by right now. Your post is still completely welcome in this room.
          </p>
        </div>

        {compact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-[#8ea3b5] hover:text-white flex items-center gap-1 shrink-0 p-1 font-sans"
          >
            <span>{isExpanded ? 'Hide' : 'Show helplines'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[rgba(233,236,238,0.08)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CRISIS_HELPLINES.map((h, i) => (
            <div
              key={i}
              className="p-3 border border-[rgba(233,236,238,0.08)] bg-[#0e1017] flex flex-col justify-between hover:border-[rgba(233,236,238,0.2)] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#e9ecee]">{h.name}</span>
                  {h.isEmergency && (
                    <span className="font-mono text-[9px] px-1 py-0.2 text-rose-300 border border-rose-800/60">
                      EMERGENCY
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6e8799] leading-normal font-sans">{h.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[rgba(233,236,238,0.06)] flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-[#6e8799]">{h.region}</span>
                {h.isLink ? (
                  <a
                    href={h.callValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#e5ab37] hover:text-white"
                  >
                    <span>DIRECTORY</span>
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  <a
                    href={`tel:${h.callValue}`}
                    className="inline-flex items-center gap-1 text-[11px] text-[#e9ecee] hover:text-white border border-[rgba(233,236,238,0.15)] hover:border-white px-2 py-0.5 transition-colors"
                  >
                    <PhoneCall size={10} />
                    <span>{h.number}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
