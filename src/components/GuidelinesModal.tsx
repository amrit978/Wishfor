'use client';

import React from 'react';
import { CRISIS_HELPLINES } from '@/lib/safety';
import { soundEngine } from '@/lib/soundscape';
import { X, Terminal } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl border border-[rgba(233,236,238,0.12)] bg-[#13151f] p-6 sm:p-8 text-[#e9ecee] shadow-2xl my-8">
        <span className="absolute -top-1.5 -left-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>
        <span className="absolute -top-1.5 -right-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>
        <span className="absolute -bottom-1.5 -left-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>
        <span className="absolute -bottom-1.5 -right-1.5 text-xs text-[#6e8799] font-mono select-none">+</span>

        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 text-[#6e8799] hover:text-white p-1 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-xs text-[#e5ab37] font-medium mb-1">
            Community Guidelines • The WishFor Promise
          </div>
          <h2 className="font-serif text-2xl font-normal text-[#e9ecee] tracking-tight">
            How we keep this room safe and kind
          </h2>
          <p className="mt-1 text-xs text-[#aab9c7] font-sans leading-relaxed">
            We wear masks not to hide from accountability, but so every human can speak without shame, fear, or lasting social labels.
          </p>
        </div>

        {/* 4 Pillars */}
        <div className="space-y-3 mb-6 text-xs font-sans">
          <div className="p-3.5 border border-[rgba(233,236,238,0.08)] bg-[#0e1017]">
            <div className="flex items-center gap-2 text-[#e5ab37] mb-1">
              <span className="px-1.5 py-0.5 border border-[#e5ab37]/40 text-[10px] font-medium">01</span>
              <h4 className="font-medium text-white">Protect everyone's anonymity</h4>
            </div>
            <p className="text-xs text-[#aab9c7] font-sans leading-relaxed">
              Never share or ask for phone numbers, emails, real names, or social media links. Posts containing personal identifiers will be automatically stopped by the safety filter.
            </p>
          </div>

          <div className="p-3.5 border border-[rgba(233,236,238,0.08)] bg-[#0e1017]">
            <div className="flex items-center gap-2 text-[#e5ab37] mb-1">
              <span className="px-1.5 py-0.5 border border-[#e5ab37]/40 text-[10px] font-medium">02</span>
              <h4 className="font-medium text-white">Speak with genuine kindness</h4>
            </div>
            <p className="text-xs text-[#aab9c7] font-sans leading-relaxed">
              People speak here when they feel exhausted or alone. Cruelty, mockery, and condescension have no place in this room. Speak as you would to someone you truly care about.
            </p>
          </div>

          <div className="p-3.5 border border-[rgba(233,236,238,0.08)] bg-[#0e1017]">
            <div className="flex items-center gap-2 text-[#e5ab37] mb-1">
              <span className="px-1.5 py-0.5 border border-[#e5ab37]/40 text-[10px] font-medium">03</span>
              <h4 className="font-medium text-white">Share lived experience, not medical diagnoses</h4>
            </div>
            <p className="text-xs text-[#aab9c7] font-sans leading-relaxed">
              Share what helped you get through your own difficult seasons. Never diagnose clinical conditions, prescribe medications, or offer formal legal counsel.
            </p>
          </div>

          <div className="p-3.5 border border-[rgba(233,236,238,0.08)] bg-[#0e1017]">
            <div className="flex items-center gap-2 text-[#e5ab37] mb-1">
              <span className="px-1.5 py-0.5 border border-[#e5ab37]/40 text-[10px] font-medium">04</span>
              <h4 className="font-medium text-white">No promotions or selling</h4>
            </div>
            <p className="text-xs text-[#aab9c7] font-sans leading-relaxed">
              No sales funnels, paid services, coaching packages, or channel invitations. Keep this room clean and free of commercial noise.
            </p>
          </div>
        </div>

        {/* Crisis helplines */}
        <div className="pt-4 border-t border-[rgba(233,236,238,0.08)] font-mono">
          <p className="text-[10px] uppercase tracking-widest text-[#6e8799] mb-2">
            CRITICAL EMERGENCY HELPLINES (24/7)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {CRISIS_HELPLINES.slice(0, 4).map((h, i) => (
              <div key={i} className="p-2.5 border border-[rgba(233,236,238,0.08)] bg-[#0e1017] flex items-center justify-between">
                <div>
                  <p className="text-[#e9ecee] text-xs font-sans">{h.name}</p>
                  <p className="text-[10px] text-[#6e8799]">{h.region}</p>
                </div>
                <a
                  href={`tel:${h.callValue}`}
                  className="px-2 py-1 border border-[rgba(233,236,238,0.2)] text-[#e9ecee] hover:border-white text-[11px] transition-colors"
                >
                  {h.number}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end font-mono text-xs">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 border border-[rgba(233,236,238,0.25)] hover:border-white text-xs font-mono uppercase tracking-wider text-white hover:bg-white/5 transition-all"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
