'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDown, Plus, ListFilter, ShieldCheck, HeartHandshake, EyeOff, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#13151f] text-[#f2f2f5] selection:bg-[#e5ab37] selection:text-[#13151f] relative">
      
      {/* 
        HERO SECTION:
        Full viewport height, atmospheric dark navy with film grain & soft blue radial glow
      */}
      <section className="min-h-screen flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-32 pt-28 pb-16 relative overflow-hidden">
        <div className="max-w-[1080px] space-y-8">
          
          <div className="text-[10px] sm:text-[12px] uppercase tracking-[0.16em] sm:tracking-[0.24em] font-medium text-[#7c8299] max-w-full leading-relaxed">
            ANONYMOUS PEER SANCTUARY // ZERO IDENTITY EXPOSURE
          </div>

          <h1 className="font-serif text-[32px] sm:text-[54px] md:text-[68px] lg:text-[76px] font-normal text-[#f2f2f5] leading-[1.0] tracking-[-0.02em] break-words">
            Say what&apos;s on your mind. <br />
            <span className="text-[#aab0c4] italic font-light">No one will know it&apos;s you.</span>
          </h1>

          <p className="font-sans text-[16px] sm:text-[19px] text-[#aab0c4] leading-[1.7] max-w-[580px]">
            A quiet room where everyone wears a mask. No real names, no profiles, and no social judgment. Share whatever weighs on you—career panic, family heartbreak, loneliness, quiet doubts—and kind strangers will reply.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/auth?redirect=/share"
              className="btn-outline !h-[50px] !px-7 text-[11px] sm:text-[12px] text-center"
            >
              <Plus size={13} className="text-[#f2f2f5] mr-2 inline" />
              <span>SAY WHAT&apos;S ON YOUR MIND</span>
            </Link>

            <Link
              href="/problems"
              className="btn-outline !h-[50px] !px-7 text-[11px] sm:text-[12px] opacity-80 hover:opacity-100 text-center"
            >
              <ListFilter size={13} className="text-[#f2f2f5] mr-2 inline" />
              <span>BROWSE THE PROBLEMS</span>
            </Link>
          </div>
        </div>

        {/* Downward prompt indicator with 1px hairline */}
        <div className="absolute bottom-8 left-6 sm:left-12 md:left-20 lg:left-32 flex items-center gap-4 text-[11px] uppercase tracking-[0.22em] text-[#7c8299]">
          <div className="w-[1px] h-10 bg-white/20 animate-pulse" />
          <span>SCROLL TO EXPLORE THE SANCTUARY</span>
        </div>
      </section>

      {/* 
        CHAPTER 1: THE ARCHITECTURE OF ANONYMITY
      */}
      <section className="py-28 px-6 sm:px-12 md:px-20 lg:px-32 border-t border-[rgba(255,255,255,0.10)]">
        <div className="max-w-[1080px] space-y-12">
          
          <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299]">
            01 // ARCHITECTURE
          </div>

          <h2 className="font-serif text-[32px] sm:text-[46px] md:text-[54px] text-[#f2f2f5] font-normal leading-[1.05] max-w-[760px]">
            A Secret Room Where Everyone Wears a Mask
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 pt-4 font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
            <div className="space-y-4">
              <p>
                In the real world, every thought you utter is tied to your name, your job title, or your social standing. When honesty carries an emotional or professional risk, people quietly swallow their pain.
              </p>
              <p>
                WishFor was conceived as a digital confessional. When you enter, you receive a rotating pseudonym—names like <em className="text-[#f2f2f5]">Quiet Lantern</em>, <em className="text-[#f2f2f5]">Silver Moth</em>, or <em className="text-[#f2f2f5]">Midnight Kite</em>.
              </p>
            </div>

            <div className="space-y-4">
              <p>
                Every thread you start or reply to assigns you a new, unconnected identity. No one can trace you across conversations. There are no public user profiles, no history feeds, and no stored device footprints.
              </p>
              <p>
                Behind the scenes, your trust score quietly follows you—rewarding genuine empathy and filtering malicious noise without ever exposing who you are.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 
        CHAPTER 2: PRINCIPLES OF PEER SOLIDARITY
      */}
      <section className="py-28 px-6 sm:px-12 md:px-20 lg:px-32 border-t border-[rgba(255,255,255,0.10)]">
        <div className="max-w-[1080px] space-y-16">
          
          <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299]">
            02 // THE SANCTUARY PRINCIPLES
          </div>

          <div className="border-t border-[rgba(255,255,255,0.10)] divide-y divide-[rgba(255,255,255,0.10)]">
            
            <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-[12px] uppercase tracking-[0.22em] text-[#7c8299]">
                RULE 01
              </div>
              <div className="md:col-span-2 space-y-2">
                <h3 className="font-serif text-[26px] text-[#f2f2f5] font-normal">
                  Peer Wisdom, Not Clinical Detachment
                </h3>
                <p className="font-sans text-[16px] text-[#aab0c4] leading-[1.75]">
                  Strangers reply with lived experience. Whether it is grief, a failing startup, or the quiet ache of family pressure, someone has walked this exact road before you and survived it.
                </p>
              </div>
            </div>

            <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-[12px] uppercase tracking-[0.22em] text-[#7c8299]">
                RULE 02
              </div>
              <div className="md:col-span-2 space-y-2">
                <h3 className="font-serif text-[26px] text-[#f2f2f5] font-normal">
                  No Algorithms, No Outrage
                </h3>
                <p className="font-sans text-[16px] text-[#aab0c4] leading-[1.75]">
                  No vanity metrics. No like counts used for virality. Replies are sorted simply by peer gratitude, and the asker can designate a single reply as &ldquo;Helped Me Most&rdquo; to pin it on top.
                </p>
              </div>
            </div>

            <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-[12px] uppercase tracking-[0.22em] text-[#7c8299]">
                RULE 03
              </div>
              <div className="md:col-span-2 space-y-2">
                <h3 className="font-serif text-[26px] text-[#f2f2f5] font-normal">
                  Trust Without Surveillance
                </h3>
                <p className="font-sans text-[16px] text-[#aab0c4] leading-[1.75]">
                  Listeners earn progressive badges—Listener, Guide, Trusted Voice. Bad advice or harassment is penalized and hidden, keeping the sanctuary peaceful without revealing a single identity.
                </p>
              </div>
            </div>

            <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-[12px] uppercase tracking-[0.22em] text-[#7c8299]">
                RULE 04
              </div>
              <div className="md:col-span-2 space-y-2">
                <h3 className="font-serif text-[26px] text-[#f2f2f5] font-normal">
                  Compassionate Crisis Safeguards
                </h3>
                <p className="font-sans text-[16px] text-[#aab0c4] leading-[1.75]">
                  If someone expresses acute danger or self-harm, our quiet detection immediately presents verified emergency resources (including Tele-MANAS 14416 and 112) without judgment or blocking the post.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        CHAPTER 3: THE PUBLIC LEDGER
      */}
      <section className="py-28 px-6 sm:px-12 md:px-20 lg:px-32 border-t border-[rgba(255,255,255,0.10)]">
        <div className="max-w-[1080px] space-y-8">
          
          <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299]">
            03 // THE PUBLIC LEDGER
          </div>

          <h2 className="font-serif text-[32px] sm:text-[46px] md:text-[54px] text-[#f2f2f5] font-normal leading-[1.05] max-w-[760px]">
            Open Worldwide to Anyone Willing to Listen
          </h2>

          <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75] max-w-[620px]">
            Every problem shared in the sanctuary is transmitted to the public ledger. People from across the world read these honest confessions, offer heartfelt perspective, and vote for the replies that bring true clarity.
          </p>

          <div className="pt-4">
            <Link
              href="/problems"
              className="btn-outline !h-[50px] !px-8 text-[12px]"
            >
              <span>BROWSE ALL PROBLEMS →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 
        TERMINAL SECTION: THE INVITATION
        At the end of the smooth scroll, a prominent invitation to express oneself
      */}
      <section className="py-36 px-6 sm:px-12 md:px-20 lg:px-32 border-t border-[rgba(255,255,255,0.10)] bg-[#0c0d14]">
        <div className="max-w-[860px] space-y-8">
          
          <div className="text-[12px] uppercase tracking-[0.24em] font-medium text-[#7c8299]">
            04 // EXPRESS YOURSELF
          </div>

          <h2 className="font-serif text-[38px] sm:text-[56px] md:text-[64px] text-[#f2f2f5] font-normal leading-[1.0] tracking-[-0.015em]">
            You don&apos;t have to carry it alone.
          </h2>

          <p className="font-sans text-[18px] text-[#aab0c4] leading-[1.75] max-w-[560px]">
            Your mask is ready. Enter the sanctuary to write what is on your mind. Once transmitted, your burden is published anonymously to the global community for peers to comfort and guide you.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/auth?redirect=/share"
              className="btn-outline !h-[52px] !px-8 text-[12px] text-white text-center"
            >
              <Plus size={14} className="mr-2 inline" />
              <span>SAY WHAT&apos;S ON YOUR MIND</span>
            </Link>

            <Link
              href="/problems"
              className="btn-outline !h-[52px] !px-8 text-[12px] opacity-80 hover:opacity-100 text-center"
            >
              <span>READ OTHERS&apos; PROBLEMS</span>
            </Link>
          </div>

          <div className="pt-8 text-[13px] text-[#7c8299] font-sans">
            Advice here comes from peers, not professionals. Zero registration requirements to read.
          </div>
        </div>
      </section>

    </div>
  );
}
