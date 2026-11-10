'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Post, Reply, CurrentUser, ReportReason } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { detectCrisis, checkDoxxing } from '@/lib/safety';
import { SplitLayout } from '@/components/SplitLayout';
import { getCategoryColor } from '@/components/RoomCanvas';
import { Heart, Check, Trash2, Flag, Bookmark, CornerDownRight, AlertCircle } from 'lucide-react';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [subReplyText, setSubReplyText] = useState('');

  // Reporting State
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'reply'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const loadData = () => {
    if (!id) return;
    const foundPost = communityStore.getPostById(id);
    setPost(foundPost || null);
    setReplies(communityStore.getRepliesForPost(id));
    setUser(communityStore.getCurrentUser());
    setBookmarks(communityStore.getBookmarks());
  };

  useEffect(() => {
    loadData();
    const unsub = communityStore.subscribe(loadData);
    return () => unsub();
  }, [id]);

  if (!post) {
    return (
      <SplitLayout eyebrow="PROBLEM" title="Nothing found">
        <div className="py-12">
          <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75] mb-8">
            This story was not found, or its author has removed it.
          </p>
          <Link href="/problems" className="btn-outline inline-flex items-center gap-2 !h-[50px] !px-7">
            <span>BACK TO PROBLEMS</span>
          </Link>
        </div>
      </SplitLayout>
    );
  }

  const categoryColor = getCategoryColor(post.category);
  const isPostAuthor = Boolean(post.is_author);
  const isBookmarked = bookmarks.includes(post.id);
  const crisisResult = detectCrisis(post.body + ' ' + (post.title || ''));

  // Separate replies into top-level and sub-replies
  const topLevelReplies = replies.filter((r) => !r.parent_reply_id);
  const subRepliesMap = replies.reduce<Record<string, Reply[]>>((acc, r) => {
    if (r.parent_reply_id) {
      if (!acc[r.parent_reply_id]) acc[r.parent_reply_id] = [];
      acc[r.parent_reply_id].push(r);
    }
    return acc;
  }, {});

  // Sort top-level replies:
  // "Helped me most" reply sits on top with "HELPED THE ASKER", others sorted by likes descending, ties broken by newest
  topLevelReplies.sort((a, b) => {
    if (a.is_helped && !b.is_helped) return -1;
    if (!a.is_helped && b.is_helped) return 1;
    if (b.like_count !== a.like_count) {
      return b.like_count - a.like_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError(null);

    if (!communityStore.isAuthenticated()) {
      router.push(`/auth?redirect=/problems/${post.id}`);
      return;
    }

    const textToSubmit = replyText.trim();
    if (!textToSubmit) return;

    // Safety checks
    const doxxing = checkDoxxing(textToSubmit);
    if (doxxing.isBlocked) {
      setReplyError(doxxing.reason || 'Personal details detected. Keep your advice completely anonymous.');
      return;
    }

    try {
      soundEngine.playResonance();
      const res = communityStore.createReply(post.id, textToSubmit);
      if (!res.success) {
        setReplyError(res.error || "That didn't go through. Try once more?");
        return;
      }
      setReplyText('');
    } catch {
      setReplyError("That didn't go through. Try once more?");
    }
  };

  const handlePostSubReply = (parentReplyId: string) => {
    if (!communityStore.isAuthenticated()) {
      router.push(`/auth?redirect=/problems/${post.id}`);
      return;
    }

    const textToSubmit = subReplyText.trim();
    if (!textToSubmit) return;

    const doxxing = checkDoxxing(textToSubmit);
    if (doxxing.isBlocked) {
      alert(doxxing.reason || 'Personal details detected.');
      return;
    }

    try {
      soundEngine.playResonance();
      const res = communityStore.createReply(post.id, textToSubmit, parentReplyId);
      if (!res.success) {
        alert(res.error || "That didn't go through. Try once more?");
        return;
      }
      setSubReplyText('');
      setReplyingToId(null);
    } catch {
      alert("That didn't go through. Try once more?");
    }
  };

  const handleDeletePost = () => {
    if (confirm('Are you sure you want to delete this problem permanently? This cannot be undone.')) {
      soundEngine.playClick();
      communityStore.deletePost(post.id);
      router.push('/problems');
    }
  };

  const handleDeleteReply = (replyId: string) => {
    if (confirm('Delete this reply permanently?')) {
      soundEngine.playClick();
      communityStore.deleteReply(replyId);
    }
  };

  const handleToggleLike = (replyId: string) => {
    soundEngine.playClick();
    communityStore.toggleLikeReply(replyId);
  };

  const handleMarkHelped = (replyId: string) => {
    soundEngine.playResonance();
    communityStore.markReplyAsHelped(post.id, replyId);
  };

  const handleToggleBookmark = () => {
    soundEngine.playClick();
    communityStore.toggleBookmark(post.id);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;

    communityStore.createReport({
      target_type: reportTarget.type,
      target_id: reportTarget.id,
      reason: reportReason,
    });
    setReportSubmitted(true);
    setTimeout(() => {
      setReportTarget(null);
      setReportSubmitted(false);
    }, 1200);
  };

  return (
    <SplitLayout
      glowColor={categoryColor}
      eyebrow="PROBLEM"
      title={post.title || post.body.slice(0, 80)}
    >
      <div className="space-y-12">
        {/* Post Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-[rgba(255,255,255,0.10)] text-[12px] uppercase tracking-[0.22em] text-[#7c8299] font-sans">
          <div className="flex items-center gap-4">
            <span className="text-[#f2f2f5] font-semibold">{post.mask_name}</span>
            <span>·</span>
            <span>{post.category}</span>
            <span>·</span>
            <span>{formatRelativeTime(post.created_at)}</span>
            {post.is_urgent && (
              <span className="text-[#e2869a] border border-[#e2869a]/40 px-2 py-0.5 rounded-[2px] text-[10px]">
                URGENT
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Bookmark */}
            <button
              onClick={handleToggleBookmark}
              className={`p-1.5 transition-colors ${
                isBookmarked ? 'text-[#e5ab37]' : 'text-[#7c8299] hover:text-[#f2f2f5]'
              }`}
              title={isBookmarked ? 'Saved in My Space' : 'Save for later'}
            >
              <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* Report Post */}
            <button
              onClick={() => setReportTarget({ type: 'post', id: post.id })}
              className="p-1.5 text-[#7c8299] hover:text-[#e2869a] transition-colors"
              title="Report this post"
            >
              <Flag size={14} />
            </button>

            {/* Delete Post (if asker) */}
            {isPostAuthor && (
              <button
                onClick={handleDeletePost}
                className="p-1.5 text-[#7c8299] hover:text-red-400 transition-colors"
                title="Delete this problem permanently"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Post Body: 17px body, line-height 1.75, max width 560px for reading text */}
        <div className="font-sans text-[17px] text-[#aab0c4] leading-[1.75] max-w-[560px] whitespace-pre-wrap">
          {post.body}
        </div>

        {/* Gentle Crisis Helpline Card if signals detected */}
        {crisisResult.hasCrisisSignals && (
          <div className="border border-[rgba(255,255,255,0.22)] p-6 bg-white/[0.02] space-y-3">
            <p className="font-serif text-[19px] text-[#f2f2f5] leading-snug">
              If things feel unbearable right now, please stay safe. You are not alone.
            </p>
            <p className="font-sans text-[14px] text-[#aab0c4] leading-relaxed">
              Trained listeners can support you right this second without judgment:
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-6 text-[13px] font-sans text-[#f2f2f5]">
              <div>
                <span className="text-[#7c8299] uppercase tracking-wider text-[11px] block">Tele-MANAS (India)</span>
                <a href="tel:14416" className="underline underline-offset-4 hover:text-[#e5ab37]">
                  14416 or 1800-891-4416
                </a>
              </div>
              <div>
                <span className="text-[#7c8299] uppercase tracking-wider text-[11px] block">Emergency Services</span>
                <a href="tel:112" className="underline underline-offset-4 hover:text-[#e5ab37]">
                  112 (National Helpline)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Peer Disclaimer */}
        <p className="text-[13px] font-sans text-[#7c8299] italic">
          Advice here comes from people like you, not professionals.
        </p>

        {/* Eyebrow REPLIES */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.10)]">
          <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299] mb-8">
            REPLIES ({replies.length})
          </div>

          {/* List of Replies */}
          {topLevelReplies.length > 0 ? (
            <div className="space-y-8 divide-y divide-[rgba(255,255,255,0.08)]">
              {topLevelReplies.map((reply) => {
                const isReplyHelped = reply.is_helped;
                const isAuthorReply = Boolean(reply.is_asker);
                const isSelfReply = Boolean(reply.is_author);
                const subReplies = subRepliesMap[reply.id] || [];

                return (
                  <div key={reply.id} className="pt-6 space-y-4">
                    {/* Top indicator if marked "helped the asker" */}
                    {isReplyHelped && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-[#e5ab37] border border-[#e5ab37]/40 bg-[#e5ab37]/5">
                        <Check size={11} />
                        <span>HELPED THE ASKER</span>
                      </div>
                    )}

                    {/* Mask Name + Trust Badge */}
                    <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.22em] font-sans">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[#f2f2f5] font-semibold">{reply.mask_name}</span>
                        {isAuthorReply && (
                          <span className="text-[#e5ab37] text-[10px] tracking-wider">[ASKER]</span>
                        )}
                        <span className="text-[#7c8299] text-[10px] tracking-widest border border-white/10 px-1.5 py-0.5 rounded-[2px]">
                          {reply.trust_level?.toUpperCase() || 'NEWCOMER'}
                        </span>
                        <span className="text-[#7c8299]">·</span>
                        <span className="text-[#7c8299] font-normal">{formatRelativeTime(reply.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Report Reply */}
                        <button
                          onClick={() => setReportTarget({ type: 'reply', id: reply.id })}
                          className="text-[#7c8299] hover:text-[#e2869a] p-1 transition-colors"
                          title="Report reply"
                        >
                          <Flag size={12} />
                        </button>

                        {/* Delete Reply (if author) */}
                        {isSelfReply && (
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            className="text-[#7c8299] hover:text-red-400 p-1 transition-colors"
                            title="Delete reply"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reply Body (17px text) */}
                    <div className="font-sans text-[17px] text-[#aab0c4] leading-[1.75] max-w-[560px] whitespace-pre-wrap">
                      {reply.body}
                    </div>

                    {/* Actions: Outline Like Button, Mark as Helped, Reply button */}
                    <div className="flex items-center gap-4 pt-2">
                      {/* Outline Like Button with real count */}
                      <button
                        onClick={() => handleToggleLike(reply.id)}
                        disabled={isSelfReply}
                        className={`
                          btn-outline !h-[38px] !px-4 text-[11px] inline-flex items-center gap-2 
                          ${isSelfReply ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={isSelfReply ? 'You cannot like your own reply' : 'Support this reply'}
                      >
                        <Heart size={12} className={reply.like_count > 0 ? 'text-[#e5ab37] fill-[#e5ab37]' : ''} />
                        <span>{reply.like_count}</span>
                      </button>

                      {/* Asker mark as helped (only on others' replies) */}
                      {isPostAuthor && !reply.is_helped && !isSelfReply && (
                        <button
                          onClick={() => handleMarkHelped(reply.id)}
                          className="btn-outline !h-[38px] !px-4 text-[11px] inline-flex items-center gap-1.5 text-[#e5ab37] border-[#e5ab37]/40 hover:border-[#e5ab37]"
                        >
                          <Check size={11} />
                          <span>THIS HELPED ME</span>
                        </button>
                      )}

                      {/* Reply button (one level deep sub-replies) */}
                      <button
                        onClick={() => {
                          if (!communityStore.isAuthenticated()) {
                            router.push(`/auth?redirect=/problems/${post.id}`);
                            return;
                          }
                          setReplyingToId(replyingToId === reply.id ? null : reply.id);
                        }}
                        className="text-[11px] uppercase tracking-[0.2em] text-[#7c8299] hover:text-[#f2f2f5] transition-colors"
                      >
                        {replyingToId === reply.id ? 'CANCEL' : 'REPLY'}
                      </button>
                    </div>

                    {/* Sub-reply input box */}
                    {replyingToId === reply.id && (
                      <div className="pl-6 border-l border-white/10 pt-3 space-y-3">
                        <textarea
                          value={subReplyText}
                          onChange={(e) => setSubReplyText(e.target.value)}
                          placeholder="Respond to this mask..."
                          rows={2}
                          className="textarea-underlined w-full max-w-[520px] text-[15px]"
                        />
                        <div>
                          <button
                            onClick={() => handlePostSubReply(reply.id)}
                            className="btn-outline !h-[38px] !px-5 text-[11px]"
                          >
                            SEND
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sub-replies rendered */}
                    {subReplies.length > 0 && (
                      <div className="pl-6 border-l border-white/10 space-y-4 pt-3">
                        {subReplies.map((sub) => (
                          <div key={sub.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] font-sans">
                              <div className="flex items-center gap-2">
                                <CornerDownRight size={11} className="text-[#7c8299]" />
                                <span className="text-[#f2f2f5] font-semibold">{sub.mask_name}</span>
                                {sub.is_asker && (
                                   <span className="text-[#e5ab37] text-[9px]">[ASKER]</span>
                                )}
                                <span className="text-[#7c8299]">·</span>
                                <span className="text-[#7c8299]">{formatRelativeTime(sub.created_at)}</span>
                              </div>
                              {sub.is_author && (
                                <button
                                  onClick={() => handleDeleteReply(sub.id)}
                                  className="text-[#7c8299] hover:text-red-400"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                            <div className="font-sans text-[15px] text-[#aab0c4] leading-relaxed max-w-[520px]">
                              {sub.body}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-[#7c8299] font-sans text-[15px]">
              No one has answered yet. You could be the first.
            </div>
          )}

          {/* Reply Form or Author Notice or Login Prompt */}
          {!communityStore.isAuthenticated() ? (
            <div className="mt-14 pt-8 border-t border-[rgba(255,255,255,0.10)]">
              <div className="p-6 sm:p-8 border border-[rgba(255,255,255,0.12)] bg-white/[0.02] space-y-4 max-w-[560px]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#7c8299] font-medium">
                  LEAVE A SUGGESTION
                </div>
                <p className="font-serif text-[22px] text-[#f2f2f5]">
                  Sign in to reply to this signal
                </p>
                <p className="font-sans text-[15px] text-[#aab0c4] leading-relaxed">
                  Anyone in the world can read problems freely. To contribute thoughtful advice and protect our sanctuary, please sign in with your email first.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/auth?redirect=/problems/${post.id}`}
                    className="btn-outline !h-[46px] !px-7 text-[11px] inline-flex items-center gap-2"
                  >
                    <span>SIGN IN TO REPLY</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : isPostAuthor ? (
            <div className="mt-14 pt-8 border-t border-[rgba(255,255,255,0.10)]">
              <div className="p-6 border border-[rgba(255,255,255,0.12)] bg-white/[0.02] space-y-2 max-w-[560px]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#e5ab37] font-medium">
                  YOUR QUESTION
                </div>
                <p className="font-serif text-[20px] text-[#f2f2f5]">
                  You asked this question.
                </p>
                <p className="font-sans text-[15px] text-[#aab0c4] leading-relaxed">
                  Fellow members will reply under rotating masks. When a suggestion brings genuine comfort or guidance, mark it as &ldquo;This helped me&rdquo; to reward the peer with +5 trust points.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePostReply} className="mt-14 pt-8 border-t border-[rgba(255,255,255,0.10)] space-y-4">
              <div className="text-[12px] uppercase tracking-[0.22em] font-medium text-[#7c8299]">
                LEAVE A SUGGESTION
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write kindly. Your mask rotates for this reply."
                rows={3}
                maxLength={2000}
                className="textarea-underlined w-full max-w-[560px]"
              />

              {replyError && (
                <p className="text-[13px] text-[#e2869a] font-sans">{replyError}</p>
              )}

              <div className="flex items-center justify-between max-w-[560px] pt-2">
                <span className="text-[12px] text-[#7c8299] font-sans">
                  {2000 - replyText.length} characters left
                </span>

                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="btn-outline !h-[46px] !px-7 disabled:opacity-30 disabled:pointer-events-none"
                >
                  SEND
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0c0d14] border border-[rgba(255,255,255,0.22)] max-w-md w-full p-6 space-y-6">
            <div className="flex items-center gap-2 text-[#e2869a]">
              <AlertCircle size={16} />
              <h3 className="font-serif text-[20px] text-[#f2f2f5]">Report Content</h3>
            </div>

            {reportSubmitted ? (
              <p className="font-sans text-[15px] text-[#7ec89f]">
                Thank you. Our moderators will review this masked transmission.
              </p>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4 font-sans text-sm">
                <p className="text-[#aab0c4] text-[14px]">
                  Select the reason for reporting this {reportTarget.type}:
                </p>

                {(['harassment', 'spam', 'hate', 'unsafe_advice', 'other'] as ReportReason[]).map((r) => (
                  <label key={r} className="flex items-center gap-3 cursor-pointer text-[#aab0c4] hover:text-white">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={() => setReportReason(r)}
                      className="accent-[#e5ab37]"
                    />
                    <span className="capitalize">{r.replace('_', ' ')}</span>
                  </label>
                ))}

                <div className="pt-4 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setReportTarget(null)}
                    className="text-[12px] uppercase tracking-widest text-[#7c8299] hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button type="submit" className="btn-outline !h-[40px] !px-6 text-[11px]">
                    SUBMIT
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </SplitLayout>
  );
}
