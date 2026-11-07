'use client';

import React, { useState } from 'react';
import { ReportReason } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'reply';
  targetId: string;
  previewText?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  previewText,
}) => {
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const reasons: Array<{ value: ReportReason; label: string; desc: string }> = [
    {
      value: 'harassment',
      label: 'Harassment & Cruelty',
      desc: 'Targeted hostility, humiliation, or cruelty towards someone.',
    },
    {
      value: 'unsafe_advice',
      label: 'Dangerous or Unsafe Advice',
      desc: 'Encouraging self-harm, reckless behavior, or fake medical cures.',
    },
    {
      value: 'doxxing',
      label: 'Sharing Personal Contact Information',
      desc: 'Revealing phone numbers, emails, real names, or social media handles.',
    },
    {
      value: 'hate',
      label: 'Hate Speech & Hostility',
      desc: 'Attacking protected groups, beliefs, or identity.',
    },
    {
      value: 'spam',
      label: 'Spam & Commercial Promotion',
      desc: 'Promoting products, paid services, telegram groups, or external links.',
    },
    {
      value: 'other',
      label: 'Other Rule Violation',
      desc: 'Any behavior breaking the safety and trust of this community.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    communityStore.createReport({
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || undefined,
    });
    soundEngine.playClick();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md border border-[rgba(233,236,238,0.12)] bg-[#13151f] p-6 text-[#e9ecee] shadow-2xl">
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 text-[#8ea3b5] hover:text-white p-1 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
            <h3 className="text-sm font-medium text-emerald-300">
              Report received
            </h3>
            <p className="text-xs text-[#aab9c7] font-sans max-w-xs mx-auto leading-relaxed">
              Thank you for looking out for others. Content receiving multiple reports is temporarily hidden pending review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-rose-300">
              <ShieldAlert size={16} />
              <h3 className="text-xs font-medium uppercase tracking-wider">
                Report a concern
              </h3>
            </div>

            {previewText && (
              <blockquote className="border-l border-[rgba(233,236,238,0.2)] bg-[#0e1017] p-2.5 text-xs text-[#aab9c7] italic line-clamp-2">
                "{previewText}"
              </blockquote>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-[#8ea3b5] font-medium block mb-1">
                Why are you reporting this?
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {reasons.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-2.5 p-2.5 border text-xs cursor-pointer transition-colors ${
                      reason === r.value
                        ? 'border-[#e5ab37] bg-white/5 text-white'
                        : 'border-[rgba(233,236,238,0.08)] bg-[#0e1017] text-[#aab9c7] hover:border-[rgba(233,236,238,0.2)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 accent-[#e5ab37]"
                    />
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-[11px] text-[#8ea3b5] mt-0.5 font-sans">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#8ea3b5] font-medium block mb-1">
                Additional context (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us what happened so our moderation team can understand..."
                rows={2}
                className="w-full border border-[rgba(233,236,238,0.12)] bg-[#0e1017] p-2.5 text-xs text-[#e9ecee] placeholder-[#8ea3b5] focus:border-[#e5ab37] focus:outline-none font-sans"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-transparent text-[#8ea3b5] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 border border-rose-500/50 hover:border-rose-400 text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                Submit report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
