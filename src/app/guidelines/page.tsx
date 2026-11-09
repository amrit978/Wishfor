'use client';

import React from 'react';
import Link from 'next/link';
import { SplitLayout } from '@/components/SplitLayout';

export default function GuidelinesPage() {
  const rules = [
    {
      num: '01',
      title: 'Be kind to one another',
      desc: 'Behind each mask is a real person going through something difficult. Speak with the same gentleness and respect you would hope for in your darkest moments.',
    },
    {
      num: '02',
      title: 'No medical or legal diagnoses',
      desc: 'Peers offer human perspective and lived experience. Do not attempt to diagnose psychological conditions or prescribe medication or legal remedies.',
    },
    {
      num: '03',
      title: 'No judgment or interrogation',
      desc: 'People share vulnerable mistakes, heartbreak, and private fears. Meet them with understanding rather than scolding or unsolicited moral lessons.',
    },
    {
      num: '04',
      title: 'No promotion or self-interest',
      desc: 'This space belongs to genuine mutual aid. Commercial solicitations, affiliate links, service pitching, and spam will result in immediate removal.',
    },
  ];

  return (
    <SplitLayout eyebrow="STANDARDS" title="Community Guidelines">
      <div className="space-y-12 max-w-[620px]">
        <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
          WishFor remains safe and comforting only because the people inside choose to protect its quiet. Please honor these four principles whenever you speak.
        </p>

        <div className="border-t border-[rgba(255,255,255,0.10)] divide-y divide-[rgba(255,255,255,0.10)]">
          {rules.map((rule) => (
            <div key={rule.num} className="py-8 space-y-2">
              <div className="text-[11px] uppercase tracking-[0.24em] font-medium text-[#7c8299]">
                RULE {rule.num}
              </div>
              <h2 className="font-serif text-[26px] text-[#f2f2f5] font-normal leading-snug">
                {rule.title}
              </h2>
              <p className="font-sans text-[16px] text-[#aab0c4] leading-[1.75]">
                {rule.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-[rgba(255,255,255,0.10)]">
          <Link
            href="/problems"
            className="btn-outline inline-flex items-center gap-2 !h-[50px] !px-8"
          >
            <span>ENTER THE COMMUNITY</span>
          </Link>
        </div>
      </div>
    </SplitLayout>
  );
}

