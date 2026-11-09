'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { detectCrisis, checkDoxxing } from '@/lib/safety';
import { SplitLayout } from '@/components/SplitLayout';
import { getCategoryColor } from '@/components/RoomCanvas';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SharePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category>('Personal');
  const [isUrgent, setIsUrgent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: Category[] = [
    'Personal',
    'Career',
    'Relationships',
    'Family',
    'Studies',
    'Financial',
    'Mental Health',
    'Existential',
  ];

  const currentCategoryColor = getCategoryColor(category);
  const crisisResult = detectCrisis(title + ' ' + body);

  const handleSubmit = (isDraft: boolean = false) => {
    setErrorMessage(null);

    const cleanBody = body.trim();
    if (!cleanBody) {
      setErrorMessage('Please share what is on your mind.');
      return;
    }

    if (cleanBody.length > 2000) {
      setErrorMessage('Please keep your problem within 2,000 characters.');
      return;
    }

    // Check post cooldown
    const cooldown = communityStore.checkPostCooldown();
    if (!cooldown.allowed) {
      setErrorMessage(
        cooldown.waitSeconds
          ? `Signal throttle active. Please pause ${cooldown.waitSeconds} seconds before posting again.`
          : 'Please pause a moment between posts.'
      );
      return;
    }

    // Doxxing check
    const doxxing = checkDoxxing(title + ' ' + cleanBody);
    if (doxxing.isBlocked) {
      setErrorMessage(doxxing.reason || 'Personal details detected. Keep your problem completely anonymous.');
      return;
    }

    setIsSubmitting(true);
    soundEngine.playResonance();

    try {
      const res = communityStore.createPost({
        title: title.trim() || undefined,
        body: cleanBody,
        category,
        is_urgent: isUrgent,
        is_draft: isDraft,
      });

      if (res.success && res.post) {
        router.push(`/problems/${res.post.id}`);
      } else {
        setErrorMessage(res.error || "That didn't go through. Try once more?");
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage("That didn't go through. Try once more?");
      setIsSubmitting(false);
    }
  };

  return (
    <SplitLayout
      glowColor={currentCategoryColor}
      eyebrow="SHARE"
      title="What's weighing on you?"
    >
      <div className="space-y-10 max-w-[580px]">
        
        {/* Quiet Anonymity Reassurance */}
        <p className="font-sans text-[15px] text-[#7c8299] italic">
          Your name is never shown. Not to anyone.
        </p>

        {/* Form */}
        <div className="space-y-8">
          
          {/* Optional Title */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.22em] text-[#7c8299] font-medium">
              TITLE <span className="opacity-60 font-normal">(OPTIONAL)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A few words to describe it..."
              maxLength={120}
              className="input-underlined w-full text-[18px] font-serif"
            />
          </div>

          {/* Underlined Textarea */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.22em] text-[#7c8299] font-medium">
              YOUR STORY
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Say what you cannot say elsewhere. Someone is in the room with you."
              rows={6}
              maxLength={2000}
              className="textarea-underlined w-full text-[17px] leading-[1.75]"
            />
            <div className="flex justify-between items-center text-[12px] text-[#7c8299] pt-1 font-sans">
              <span>Plain and honest words.</span>
              <span>{2000 - body.length} characters left</span>
            </div>
          </div>

          {/* Category Selector: Outline pill buttons */}
          <div className="space-y-3">
            <label className="block text-[11px] uppercase tracking-[0.22em] text-[#7c8299] font-medium">
              CATEGORY
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCategory(cat);
                    }}
                    className={`
                      px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-all duration-200 border rounded-[2px]
                      ${
                        isSelected
                          ? 'border-white/70 text-[#f2f2f5] bg-white/5'
                          : 'border-[rgba(255,255,255,0.14)] text-[#7c8299] hover:border-white/30 hover:text-[#aab0c4]'
                      }
                    `}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgent Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-[rgba(255,255,255,0.10)] py-4">
            <div>
              <span className="block text-[13px] text-[#f2f2f5] font-sans">
                Mark as urgent
              </span>
              <span className="block text-[12px] text-[#7c8299] font-sans">
                Alerts active listeners if you need quick guidance tonight
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsUrgent(!isUrgent);
              }}
              className={`
                px-4 py-2 text-[11px] uppercase tracking-[0.18em] border rounded-[2px] transition-colors
                ${
                  isUrgent
                    ? 'border-[#e2869a] text-[#e2869a] bg-[#e2869a]/5'
                    : 'border-white/20 text-[#7c8299] hover:text-white'
                }
              `}
            >
              {isUrgent ? 'URGENT' : 'STANDARD'}
            </button>
          </div>

          {/* Crisis Helpline Alert if detected */}
          {crisisResult.hasCrisisSignals && (
            <div className="border border-[rgba(255,255,255,0.22)] p-6 bg-white/[0.02] space-y-3">
              <p className="font-serif text-[18px] text-[#f2f2f5] leading-snug">
                You matter. If you are in immediate danger or considering self-harm, please reach out to someone who can help right now.
              </p>
              <div className="text-[13px] font-sans text-[#aab0c4] flex flex-wrap gap-6 pt-1">
                <div>
                  <span className="text-[#7c8299] uppercase text-[10px] block tracking-wider">Tele-MANAS</span>
                  <a href="tel:14416" className="text-[#f2f2f5] underline underline-offset-4 hover:text-[#e5ab37]">
                    14416 (Toll-Free 24/7)
                  </a>
                </div>
                <div>
                  <span className="text-[#7c8299] uppercase text-[10px] block tracking-wider">Emergency</span>
                  <a href="tel:112" className="text-[#f2f2f5] underline underline-offset-4 hover:text-[#e5ab37]">
                    112
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 text-[#e2869a] text-[13px] font-sans">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons: Outline Only */}
          <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || !body.trim()}
              className="text-[12px] uppercase tracking-[0.22em] text-[#7c8299] hover:text-[#f2f2f5] transition-colors disabled:opacity-40"
            >
              SAVE AS DRAFT
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !body.trim()}
              className="btn-outline !h-[50px] !px-8 disabled:opacity-40"
            >
              {isSubmitting ? 'TRANSMITTING...' : 'POST IT'}
            </button>
          </div>
        </div>
      </div>
    </SplitLayout>
  );
}
