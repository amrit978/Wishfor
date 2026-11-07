'use client';

import React, { useState, useEffect } from 'react';
import { Post, Reply } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { MaskAvatar } from './MaskAvatar';
import { TrustBadge } from './TrustBadge';
import { CrisisBanner } from './CrisisBanner';
import { ReportModal } from './ReportModal';
import { checkDoxxing } from '@/lib/safety';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Flag,
  Trash2,
  Send,
  CornerDownRight,
  Sparkles,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface ThreadViewProps {
  postId: string;
  onBack: () => void;
  onPostDeleted?: () => void;
}

export const ThreadView: React.FC<ThreadViewProps> = ({
  postId,
  onBack,
  onPostDeleted,
}) => {
  const [post, setPost] = useState<Post | undefined>(() => communityStore.getPostById(postId));
  const [replies, setReplies] = useState<Reply[]>(() => communityStore.getRepliesForPost(postId));
  const [replyBody, setReplyBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(post?.is_saved || false);

  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'reply';
    id: string;
    text: string;
  } | null>(null);

  const refresh = () => {
    const updatedPost = communityStore.getPostById(postId);
    setPost(updatedPost);
    if (updatedPost) {
      setReplies(communityStore.getRepliesForPost(postId));
      setIsSaved(updatedPost.is_saved || false);
    }
  };

  useEffect(() => {
    refresh();
    const unsubscribe = communityStore.subscribe(refresh);
    return () => unsubscribe();
  }, [postId]);

  if (!post) {
    return (
      <div className="py-24 text-center text-[#6e8799] font-mono text-xs">
        <p>This whisper has dissolved into the room.</p>
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="mt-4 px-4 py-1.5 border border-[rgba(233,236,238,0.15)] text-[#e9ecee] hover:border-white uppercase text-[11px] tracking-wider transition-colors"
        >
          Return to Whispers
        </button>
      </div>
    );
  }

  const handleToggleBookmark = () => {
    const updated = communityStore.toggleBookmark(post.id);
    setIsSaved(updated);
  };

  const handleDeletePost = () => {
    if (window.confirm('Permanently purge this whisper?')) {
      communityStore.deletePost(post.id);
      if (onPostDeleted) onPostDeleted();
      onBack();
    }
  };

  const handleSendReply = () => {
    setError(null);
    if (!replyBody.trim()) {
      setError('Response cannot be empty.');
      return;
    }
    if (replyBody.length > 2000) {
      setError('Please keep response under 2000 characters.');
      return;
    }

    const doxx = checkDoxxing(replyBody);
    if (doxx.isBlocked) {
      setError(doxx.reason || 'Doxxing detected');
      return;
    }

    setIsSubmitting(true);
    const res = communityStore.createReply(post.id, replyBody, replyingTo ? replyingTo.id : null);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to submit response.');
      return;
    }

    setReplyBody('');
    setReplyingTo(null);
    refresh();
  };

  const handleToggleLike = (replyId: string) => {
    const res = communityStore.toggleLikeReply(replyId);
    if (!res.success && res.error) {
      setError(res.error);
      setTimeout(() => setError(null), 3000);
    }
    refresh();
  };

  const handleMarkHelped = (replyId: string) => {
    communityStore.markReplyAsHelped(post.id, replyId);
    refresh();
  };

  const handleDeleteReply = (replyId: string) => {
    if (window.confirm('Permanently delete your advice?')) {
      communityStore.deleteReply(replyId);
      refresh();
    }
  };

  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (3600 * 1000));
    const days = Math.floor(diff / (24 * 3600 * 1000));

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24 animate-in fade-in duration-200">
      {/* Top Protocol Bar */}
      <div className="flex items-center justify-between text-xs text-[#aab9c7]">
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 hover:text-white transition-colors text-xs"
        >
          <ArrowLeft size={13} />
          <span>Back to the room</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#8ea3b5]">
          <span>Topic: {post.category}</span>
          {post.is_urgent && <span className="text-rose-300">• Needs support</span>}
        </div>
      </div>

      {/* Main Whisper Container */}
      <div className="border border-[rgba(233,236,238,0.08)] bg-[#13151f] p-7 sm:p-9 text-[#e9ecee]">
        {/* Author Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(233,236,238,0.06)]">
          <div className="flex items-center gap-3">
            <MaskAvatar
              name={post.mask_name}
              seed={post.mask_seed}
              size="lg"
              isAsker={post.is_asker}
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-base text-[#e9ecee]">
                  {post.mask_name}
                </span>

                <span className="text-[11px] text-[#e5ab37] font-medium font-sans">
                  Author
                </span>

                <TrustBadge level={post.trust_level} />
              </div>

              <div className="text-[11px] text-[#8ea3b5] mt-0.5">
                <span>{formatTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#8ea3b5]">
            <button
              onClick={handleToggleBookmark}
              className={`p-1.5 transition-colors ${
                isSaved ? 'text-[#e5ab37]' : 'hover:text-white'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save problem'}
            >
              <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() =>
                setReportTarget({
                  type: 'post',
                  id: post.id,
                  text: post.title || post.body,
                })
              }
              className="p-1.5 hover:text-rose-400 transition-colors"
              title="Report"
            >
              <Flag size={15} />
            </button>

            {post.is_author && (
              <button
                onClick={handleDeletePost}
                className="p-1.5 hover:text-rose-400 transition-colors ml-1"
                title="Delete post"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <h1 className="font-serif text-2xl font-normal text-white mb-4 leading-snug">
            {post.title}
          </h1>
        )}

        {/* Body */}
        <div className="text-base text-[#e9ecee] leading-relaxed font-sans whitespace-pre-line mb-8 font-normal">
          {post.body}
        </div>

        {post.crisis_flagged && <CrisisBanner />}

        <div className="pt-4 border-t border-[rgba(233,236,238,0.06)] flex items-center justify-between text-xs text-[#8ea3b5]">
          <span>Peer advice only. Not a medical or legal diagnosis.</span>
          <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        </div>
      </div>

      {/* Reply Transmission Area */}
      <div className="border border-[rgba(233,236,238,0.08)] bg-[#13151f] p-6 text-[#e9ecee]">
        <div className="flex items-center justify-between mb-3 text-xs text-[#aab9c7]">
          <span>
            {replyingTo ? `Replying to ${replyingTo.mask_name}` : 'Reply with kindness or advice'}
          </span>

          {replyingTo && (
            <button
              onClick={() => setReplyingTo(null)}
              className="text-[#8ea3b5] hover:text-white underline text-[11px]"
            >
              Cancel reply
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Write gently. What would you tell a close friend going through this?"
          rows={3}
          maxLength={2000}
          className="w-full bg-[#0e1017] border border-[rgba(233,236,238,0.08)] p-3 text-sm text-[#e9ecee] placeholder-[#8ea3b5] focus:border-[rgba(233,236,238,0.3)] focus:outline-none leading-relaxed transition-colors resize-y min-h-[90px] font-sans"
        />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#8ea3b5]">
            {replyBody.length} / 2000 chars • +1 Trust point for helping
          </span>

          <button
            onClick={handleSendReply}
            disabled={isSubmitting || !replyBody.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-[rgba(233,236,238,0.22)] hover:border-white text-xs font-medium text-[#e9ecee] transition-all hover:bg-white/5 disabled:opacity-40"
          >
            <Send size={11} />
            <span>Send reply</span>
          </button>
        </div>
      </div>

      {/* Responses Section Header */}
      <div className="flex items-center justify-between pt-2 text-xs text-[#8ea3b5]">
        <span className="font-medium text-[#e9ecee]">Replies ({replies.length})</span>
        <span>Most helpful first</span>
      </div>

      {/* Replies List */}
      {replies.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[rgba(233,236,238,0.08)] p-8 text-xs text-[#6e8799]">
          <p>Silence here so far. Be the first kind presence to break it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {replies.map((reply) => {
            const isHelpedPinned = post.helped_reply_id === reply.id || reply.is_helped;

            return (
              <div
                key={reply.id}
                className={`border p-6 transition-all duration-200 ${
                  isHelpedPinned
                    ? 'border-[#e5ab37]/40 bg-[#161824]'
                    : 'border-[rgba(233,236,238,0.08)] bg-[#13151f]'
                }`}
              >
                {/* Pinned Helpful Banner */}
                {isHelpedPinned && (
                  <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-[#e5ab37] font-medium tracking-wide">
                    <Sparkles size={12} />
                    <span>The author found this advice most helpful (+5 trust points)</span>
                  </div>
                )}

                {/* Reply Header */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <MaskAvatar
                      name={reply.mask_name}
                      seed={reply.mask_seed}
                      size="md"
                      isAsker={reply.is_asker}
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#e9ecee]">
                          {reply.mask_name}
                        </span>

                        {reply.is_asker && (
                          <span className="text-[11px] text-[#e5ab37] font-medium font-sans">
                            Author
                          </span>
                        )}

                        <TrustBadge level={reply.trust_level} />
                      </div>

                      <div className="text-[11px] text-[#8ea3b5] mt-0.5">
                        <span>{formatTime(reply.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#8ea3b5]">
                    <button
                      onClick={() =>
                        setReportTarget({
                          type: 'reply',
                          id: reply.id,
                          text: reply.body,
                        })
                      }
                      className="p-1 hover:text-rose-400 transition-colors"
                      title="Report"
                    >
                      <Flag size={13} />
                    </button>

                    {reply.is_author && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className="p-1 hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reply Body */}
                <p className="text-sm text-[#e9ecee] leading-relaxed font-sans whitespace-pre-line mb-4 font-normal">
                  {reply.body}
                </p>

                {/* Reply Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[rgba(233,236,238,0.06)] text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(reply.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border transition-all text-xs ${
                        reply.has_liked
                          ? 'border-rose-500/50 text-rose-300 bg-rose-500/10'
                          : 'border-[rgba(233,236,238,0.1)] text-[#aab9c7] hover:text-white'
                      }`}
                      title={reply.is_author ? "You cannot like your own advice" : 'Mark as helpful (+1 trust point)'}
                    >
                      <Heart
                        size={12}
                        fill={reply.has_liked ? 'currentColor' : 'none'}
                        className={reply.has_liked ? 'text-rose-400' : ''}
                      />
                      <span>{reply.like_count} {reply.like_count === 1 ? 'helpful' : 'helpful'}</span>
                    </button>

                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setReplyingTo(reply);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      className="text-[#aab9c7] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <CornerDownRight size={11} />
                      <span>Reply</span>
                    </button>
                  </div>

                  {post.is_author && !reply.is_author && (
                    <button
                      onClick={() => handleMarkHelped(reply.id)}
                      className={`text-xs px-2.5 py-1 border transition-all ${
                        isHelpedPinned
                          ? 'border-[#e5ab37] text-[#e5ab37]'
                          : 'border-[rgba(233,236,238,0.15)] text-[#aab9c7] hover:text-white'
                      }`}
                    >
                      <Award size={12} className="inline mr-1" />
                      <span>
                        {isHelpedPinned ? 'Marked as helpful' : 'This helped me (+5)'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Sub-replies */}
                {reply.sub_replies && reply.sub_replies.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[rgba(233,236,238,0.06)] space-y-2.5 pl-4 border-l border-[rgba(233,236,238,0.1)]">
                    {reply.sub_replies.map((sub) => (
                      <div key={sub.id} className="p-3 bg-[#0e1017]">
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <MaskAvatar name={sub.mask_name} seed={sub.mask_seed} size="sm" isAsker={sub.is_asker} />
                            <span className="font-medium text-[#e9ecee]">{sub.mask_name}</span>
                            {sub.is_asker && <span className="text-[11px] text-[#e5ab37] font-medium font-sans">Author</span>}
                            <TrustBadge level={sub.trust_level} />
                          </div>

                          <span className="text-[10px] text-[#8ea3b5]">{formatTime(sub.created_at)}</span>
                        </div>

                        <p className="text-xs text-[#aab9c7] leading-relaxed font-sans mb-2">
                          {sub.body}
                        </p>

                        <button
                          onClick={() => handleToggleLike(sub.id)}
                          className={`inline-flex items-center gap-1 text-[11px] ${
                            sub.has_liked ? 'text-rose-400' : 'text-[#6e8799] hover:text-white'
                          }`}
                        >
                          <Heart size={10} fill={sub.has_liked ? 'currentColor' : 'none'} />
                          <span>{sub.like_count}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          previewText={reportTarget.text}
        />
      )}
    </div>
  );
};
