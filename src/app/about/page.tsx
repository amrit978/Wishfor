'use client';

import React from 'react';
import Link from 'next/link';
import { SplitLayout } from '@/components/SplitLayout';
import { Plus } from 'lucide-react';

export default function AboutPage() {
  return (
    <SplitLayout eyebrow="ABOUT" title="A secret room where everyone wears a mask">
      <div className="space-y-16 max-w-[860px]">
        
        {/* Intro Body Text: 17px, line-height 1.75, max-w about 560px for reading text */}
        <div className="space-y-6 font-sans text-[17px] text-[#aab0c4] leading-[1.75] max-w-[560px]">
          <p>
            WishFor is an anonymous peer sanctuary. We built it for the thoughts you cannot put your real name next to: quiet doubts about your career, private family strain, exhaustion you cannot explain to friends, and decisions you cannot undo alone.
          </p>
          <p>
            Here, strangers listen without knowing who you are, and you listen to others without knowing who they are.
          </p>
        </div>

        {/* 
          Two-column blocks: 
          400px column, 60px gap, serif 28px sub-headings, and 17px body text.
        */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.10)] space-y-12">
          <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299]">
            HOW IT WORKS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 md:gap-x-[60px]">
            {/* Column 1 */}
            <div className="max-w-[400px] space-y-3">
              <h2 className="font-serif text-[28px] text-[#f2f2f5] font-normal leading-tight">
                Rotating Masks
              </h2>
              <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
                Every time you enter a thread or write a reply, you receive a new pseudonym mask. No one can track you from one problem to another.
              </p>
            </div>

            {/* Column 2 */}
            <div className="max-w-[400px] space-y-3">
              <h2 className="font-serif text-[28px] text-[#f2f2f5] font-normal leading-tight">
                Zero Footprint
              </h2>
              <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
                We do not expose emails, telephone numbers, IP addresses, or device data. What you say here exists only between peers in the room.
              </p>
            </div>

            {/* Column 3 */}
            <div className="max-w-[400px] space-y-3">
              <h2 className="font-serif text-[28px] text-[#f2f2f5] font-normal leading-tight">
                Trust Without Identity
              </h2>
              <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
                Helping others earns quiet badges—Listener, Guide, Trusted Voice. Helpful advice is elevated, while malice and bad advice are swiftly removed.
              </p>
            </div>

            {/* Column 4 */}
            <div className="max-w-[400px] space-y-3">
              <h2 className="font-serif text-[28px] text-[#f2f2f5] font-normal leading-tight">
                Peer Wisdom Only
              </h2>
              <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
                This is a place for human solidarity, not professional therapy or legal advice. If you are in crisis, we connect you directly to free verified helplines.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.10)] flex flex-wrap items-center gap-6">
          <Link
            href="/share"
            className="btn-outline inline-flex items-center gap-2.5 !h-[50px] !px-8"
          >
            <Plus size={12} className="text-[#f2f2f5]" />
            <span>SHARE WHAT WEIGHS ON YOU</span>
          </Link>

          <Link
            href="/guidelines"
            className="text-[12px] uppercase tracking-[0.22em] text-[#7c8299] hover:text-[#f2f2f5] transition-colors"
          >
            COMMUNITY GUIDELINES →
          </Link>
        </div>
      </div>
    </SplitLayout>
  );
}

