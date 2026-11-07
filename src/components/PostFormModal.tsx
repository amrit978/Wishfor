'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { checkDoxxing, detectCrisis } from '@/lib/safety';
import { CrisisBanner } from './CrisisBanner';
import { X, AlertTriangle, Heart, Sparkles } from 'lucide-react';

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (postId: string) => void;
}

export const PostFormModal: React.FC<PostFormModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [category, setCategory] = useState<Category>('Personal');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCrisis, setHasCrisis] = useState(false);
  const [doxxingWarning, setDoxxingWarning] = useState<string | null>(null);

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

  useEffect(() => {
    const combined = `${title} ${body}`;
    const crisis = detectCrisis(combined);
    setHasCrisis(crisis.hasCrisisSignals);

    const doxx = checkDoxxing(combined);
    if (doxx.isBlocked) {
      setDoxxingWarning(doxx.reason || null);
    } else {
      setDoxxingWarning(null);
    }
  }, [title, body]);

  if (!isOpen) return null;

  const handleSubmit = (isDraft: boolean = false) => {
    setError(null);
    if (!body.trim()) {
      setError('Please write what you would like to share.');
      return;
    }
    if (body.length > 2000) {
      setError('Please keep your post within 2000 characters.');
      return;
    }

    setIsSubmitting(true);
    const result = communityStore.createPost({
      category,
      title: title.trim() || undefined,
      body: body.trim(),
      is_urgent: isUrgent,
      is_draft: isDraft,
    });

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Could not post your problem.');
      return;
    }

    setTitle('');
    setBody('');
    setIsUrgent(false);
    onClose();
    if (result.post && onCreated) {
      onCreated(result.post.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl border border-[rgba(233,236,238,0.12)] bg-[#13151f] p-6 sm:p-8 text-[#e9ecee] shadow-2xl my-8">
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

        {/* Modal Header */}
        <div className="mb-6">
          <div className="text-xs text-[#e5ab37] font-sans font-medium mb-1">
            Anonymous Peer Room • Masked Identity
          </div>
          <h2 className="font-serif text-2xl font-normal text-[#e9ecee] tracking-tight">
            Speak into the room.
          </h2>
          <p className="mt-1 text-xs text-[#aab9c7] font-sans leading-relaxed">
            Your real identity is never shown. A unique mask name and avatar will be generated just for this post, keeping you completely anonymous.
          </p>
        </div>

        {hasCrisis && <CrisisBanner compact />}

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            <AlertTriangle size={13} />
            <span>{error}</span>
          </div>
        )}

        {doxxingWarning && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-amber-950/40 border border-amber-600 text-xs text-amber-200">
            <AlertTriangle size={13} />
            <span>{doxxingWarning}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs text-[#8ea3b5] font-medium mb-2">
              Topic
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCategory(cat);
                  }}
                  className={`px-3 py-1 text-xs font-sans border transition-all ${
                    category === cat
                      ? 'border-[#e5ab37] text-white bg-white/5 font-medium'
                      : 'border-[rgba(233,236,238,0.08)] bg-[#0e1017] text-[#8ea3b5] hover:border-[rgba(233,236,238,0.2)] hover:text-[#e9ecee]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-[#8ea3b5] font-medium mb-1">
              One-line summary (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What has been keeping you awake?"
              className="w-full border border-[rgba(233,236,238,0.12)] bg-[#0e1017] px-3.5 py-2 text-sm text-[#e9ecee] placeholder-[#8ea3b5] focus:border-[#e5ab37] focus:outline-none transition-colors font-sans"
              maxLength={140}
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-[#8ea3b5] font-medium">
                Your story
              </label>
              <span className={`text-[11px] ${body.length > 1800 ? 'text-[#e5ab37]' : 'text-[#8ea3b5]'}`}>
                {body.length} / 2000 characters
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Take your time. Speak honestly about what you are carrying. Strangers here listen with kindness, not judgment..."
              rows={5}
              maxLength={2000}
              className="w-full border border-[rgba(233,236,238,0.12)] bg-[#0e1017] p-3 text-sm text-[#e9ecee] placeholder-[#8ea3b5] focus:border-[#e5ab37] focus:outline-none leading-relaxed transition-colors resize-y min-h-[120px] font-sans"
            />
          </div>

          {/* Urgent Priority Toggle */}
          <div className="flex items-center justify-between p-3 border border-[rgba(233,236,238,0.08)] bg-[#0e1017]">
            <div className="flex items-center gap-2.5">
              <Heart size={14} className={isUrgent ? 'text-rose-400 fill-rose-400' : 'text-[#8ea3b5]'} />
              <div>
                <p className="text-xs text-[#e9ecee] font-medium">
                  I need support tonight (urgent)
                </p>
                <p className="text-[11px] text-[#8ea3b5] font-sans">
                  Gently highlights your post so people looking to help can find it faster.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsUrgent(!isUrgent);
              }}
              className={`px-3 py-1 text-xs border transition-all ${
                isUrgent
                  ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                  : 'border-[rgba(233,236,238,0.1)] text-[#8ea3b5] hover:border-[rgba(233,236,238,0.25)]'
              }`}
            >
              {isUrgent ? 'Active' : 'Off'}
            </button>
          </div>

          <div className="border border-[rgba(233,236,238,0.06)] bg-[#0e1017] p-2.5 text-[11px] text-[#8ea3b5]">
            Advice here comes from peers sharing lived experience, not professional doctors or lawyers.
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || !body.trim()}
              className="w-full sm:w-auto px-4 py-2 border border-[rgba(233,236,238,0.12)] text-[#aab9c7] hover:text-white hover:border-[rgba(233,236,238,0.25)] transition-colors disabled:opacity-40"
            >
              Save as draft
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-[#8ea3b5] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !body.trim() || !!doxxingWarning}
                className="w-full sm:w-auto px-5 py-2 border border-[rgba(233,236,238,0.25)] hover:border-white text-xs font-medium text-white transition-all hover:bg-white/5 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <span>Post to the room</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
