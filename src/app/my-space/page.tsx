'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post, Reply, CurrentUser } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { SplitLayout } from '@/components/SplitLayout';
import { Plus, Award, CheckCircle2, ShieldCheck, Heart, Check, LogOut, ExternalLink, Bookmark } from 'lucide-react';

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

function maskIdentifier(val: string, method: 'email' | 'phone'): string {
  if (!val) return '';
  if (method === 'email') {
    const parts = val.trim().split('@');
    if (parts.length < 2) return val;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}*`;
    return `${maskedName}@${domain}`;
  }
  const digits = val.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+${digits.slice(0, digits.length - 8)}******${digits.slice(-4)}`;
  }
  return val;
}

export default function MySpacePage() {
  const router = useRouter();

  const [tab, setTab] = useState<'questions' | 'contributions' | 'saved'>('questions');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allReplies, setAllReplies] = useState<Reply[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadData = () => {
    setUser(communityStore.getCurrentUser());
    setAllPosts(communityStore.getPosts());
    setAllReplies(communityStore.getAllReplies());
    setBookmarks(communityStore.getBookmarks());
  };

  useEffect(() => {
    setMounted(true);
    loadData();
    const unsub = communityStore.subscribe(loadData);
    return () => unsub();
  }, []);

  if (!mounted) return null;

  const isAuthenticated = communityStore.isAuthenticated();

  if (!isAuthenticated) {
    return (
      <SplitLayout eyebrow="SANCTUARY PROFILE" title="Your Personal Corner">
        <div className="space-y-10 max-w-[560px]">
          <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
            You are currently logged out. To view your personal questions, peer contributions, and earned trust reputation, please enter your email to receive an instant verification code.
          </p>

          <div className="border border-[rgba(255,255,255,0.12)] bg-white/[0.02] p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#e5ab37] font-medium">
                AUTHENTICATION REQUIRED
              </div>
              <h3 className="font-serif text-[24px] text-[#f2f2f5]">
                Log In or Sign Up
              </h3>
              <p className="font-sans text-[15px] text-[#7c8299] leading-relaxed">
                Wishfor uses passwordless email verification. Enter your email once, and your previous questions and contributions will be restored automatically.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href="/auth?redirect=/my-space"
                className="btn-outline !h-[48px] !px-8 text-[12px] inline-flex items-center justify-center gap-2"
              >
                <span>ENTER VIA EMAIL OTP</span>
                <span>→</span>
              </Link>

              <Link
                href="/problems"
                className="text-[12px] uppercase tracking-[0.2em] text-[#7c8299] hover:text-[#f2f2f5] transition-colors py-3 sm:py-0 text-center sm:text-left"
              >
                BROWSE PUBLIC PROBLEMS
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-[rgba(255,255,255,0.10)] text-[13px] text-[#7c8299] leading-relaxed">
            Public problems are always open to everyone worldwide. Sign in only when you wish to share questions, reply to others, or track your contributions.
          </div>
        </div>
      </SplitLayout>
    );
  }

  const myPosts = allPosts.filter((p) => p.is_author);
  const myReplies = allReplies.filter((r) => r.is_author);
  const savedPosts = allPosts.filter((p) => bookmarks.includes(p.id));
  const helpedCount = myReplies.filter((r) => r.is_helped).length;
  const totalLikesReceived = myReplies.reduce((sum, r) => sum + (r.like_count || 0), 0);

  const isVerified = Boolean(user?.email || user?.phone);

  return (
    <SplitLayout eyebrow="SANCTUARY PROFILE" title="Your Member Profile">
      <div className="space-y-12 max-w-[700px]">
        
        {/* Profile Card: Credentials, Verification Status & Trust Metrics */}
        <div className="border border-[rgba(255,255,255,0.12)] bg-white/[0.02] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#7c8299] font-medium flex items-center gap-2">
                <span>IDENTITY MASK</span>
                {isVerified ? (
                  <span className="text-[#7ec89f] inline-flex items-center gap-1 text-[10px] tracking-wider">
                    <ShieldCheck size={12} /> VERIFIED
                  </span>
                ) : (
                  <span className="text-[#e5ab37] inline-flex items-center gap-1 text-[10px] tracking-wider">
                    UNVERIFIED GUEST
                  </span>
                )}
              </div>

              <div className="font-serif text-[26px] text-[#f2f2f5]">
                Rotating Sanctuary Mask
              </div>

              <p className="text-[13px] text-[#7c8299] font-sans">
                {isVerified ? (
                  <span>Bound to <code className="text-[#aab0c4] font-mono">{user?.email ? maskIdentifier(user.email, 'email') : maskIdentifier(user?.phone || '', 'phone')}</code>. True details are never revealed.</span>
                ) : (
                  <span>Guest session. Connect your email or phone to keep your trust score across devices.</span>
                )}
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
              {!isVerified ? (
                <Link
                  href="/auth?redirect=/my-space"
                  className="btn-outline !h-[42px] !px-5 text-[11px] text-[#e5ab37] border-[#e5ab37]/40 hover:border-[#e5ab37]"
                >
                  VERIFY ID (+5 PTS)
                </Link>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7ec89f] border border-[#7ec89f]/40 bg-[#7ec89f]/5">
                  <CheckCircle2 size={12} />
                  <span>IDENTITY SECURED</span>
                </div>
              )}
            </div>
          </div>

          {/* 4-Stat Metric Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 font-sans">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">QUESTIONS</div>
              <div className="font-serif text-[24px] text-[#f2f2f5]">{myPosts.length}</div>
              <div className="text-[11px] text-[#7c8299]">Problems asked</div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">CONTRIBUTIONS</div>
              <div className="font-serif text-[24px] text-[#f2f2f5]">{myReplies.length}</div>
              <div className="text-[11px] text-[#7c8299]">Peer replies</div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">PEERS HELPED</div>
              <div className="font-serif text-[24px] text-[#e5ab37]">{helpedCount}</div>
              <div className="text-[11px] text-[#7c8299]">Designated best</div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">TRUST LEVEL</div>
              <div className="font-serif text-[18px] text-[#f2f2f5] flex items-center gap-1.5">
                <Award size={14} className="text-[#e5ab37]" />
                <span className="truncate">{user?.trust_level || 'Newcomer'}</span>
              </div>
              <div className="text-[11px] text-[#7c8299] font-mono">{user?.trust_score || 0} pts</div>
            </div>
          </div>
        </div>

        {/* Tracked Tabs: QUESTIONS, CONTRIBUTIONS, SAVED */}
        <div className="border-b border-[rgba(255,255,255,0.10)] flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar max-w-full text-[11px] sm:text-[12px] uppercase font-medium tracking-[0.18em] sm:tracking-[0.22em]">
          <button
            onClick={() => {
              soundEngine.playClick();
              setTab('questions');
            }}
            className={`pb-3 border-b-2 transition-colors duration-250 whitespace-nowrap ${
              tab === 'questions'
                ? 'border-[#f2f2f5] text-[#f2f2f5]'
                : 'border-transparent text-[#7c8299] hover:text-[#f2f2f5]'
            }`}
          >
            MY QUESTIONS ({myPosts.length})
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setTab('contributions');
            }}
            className={`pb-3 border-b-2 transition-colors duration-250 whitespace-nowrap ${
              tab === 'contributions'
                ? 'border-[#f2f2f5] text-[#f2f2f5]'
                : 'border-transparent text-[#7c8299] hover:text-[#f2f2f5]'
            }`}
          >
            MY CONTRIBUTIONS ({myReplies.length})
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setTab('saved');
            }}
            className={`pb-3 border-b-2 transition-colors duration-250 whitespace-nowrap ${
              tab === 'saved'
                ? 'border-[#f2f2f5] text-[#f2f2f5]'
                : 'border-transparent text-[#7c8299] hover:text-[#f2f2f5]'
            }`}
          >
            SAVED ({savedPosts.length})
          </button>
        </div>

        {/* Tab 1: Questions (Problems Posted) */}
        {tab === 'questions' && (
          <div key="tab-questions" className="tab-pane-transition">
            {myPosts.length > 0 ? (
              <div className="divide-y divide-[rgba(255,255,255,0.10)]">
                {myPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      soundEngine.playClick();
                      router.push(`/problems/${post.id}`);
                    }}
                    className="
                      group py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 
                      cursor-pointer transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1
                    "
                  >
                    <div className="space-y-1.5 pr-4">
                      <h3 className="font-serif text-[22px] sm:text-[26px] text-[#f2f2f5] group-hover:text-white transition-colors truncate max-w-[420px]">
                        {post.title || post.body}
                      </h3>
                      <div className="flex items-center gap-4 text-[13px] text-[#7c8299] font-sans">
                        <span>{formatRelativeTime(post.created_at)}</span>
                        <span>·</span>
                        <span>{post.category}</span>
                        {post.helped_reply_id && (
                          <span className="text-[#e5ab37] inline-flex items-center gap-1 text-[11px]">
                            <Check size={11} /> SOLVED
                          </span>
                        )}
                        {post.status === 'draft' && (
                          <span className="text-[#e5ab37] border border-[#e5ab37]/40 px-1.5 py-0.2 rounded text-[10px]">
                            DRAFT
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-center">
                      <span className="btn-outline inline-flex items-center justify-center !h-[38px] !px-4 text-[11px] group-hover:border-white/60">
                        OPEN · {post.reply_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center space-y-4 border border-dashed border-white/10 p-8">
                <p className="font-serif text-[22px] text-[#f2f2f5]">
                  You have not asked any questions yet.
                </p>
                <p className="font-sans text-[15px] text-[#aab0c4] leading-[1.7] max-w-[440px] mx-auto">
                  Whatever is weighing on your mind, say it freely. Every question is published under an anonymous rotating mask.
                </p>
                <div className="pt-2">
                  <Link
                    href="/share"
                    className="btn-outline inline-flex items-center gap-2 !h-[46px] !px-6 text-[11px]"
                  >
                    <Plus size={12} className="text-[#f2f2f5]" />
                    <span>ASK A QUESTION</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Contributions (Replies/Advice Given) */}
        {tab === 'contributions' && (
          <div key="tab-contributions" className="tab-pane-transition">
            {myReplies.length > 0 ? (
              <div className="divide-y divide-[rgba(255,255,255,0.10)]">
                {myReplies.map((reply) => {
                  const targetPost = allPosts.find((p) => p.id === reply.post_id);
                  return (
                    <div
                      key={reply.id}
                      onClick={() => {
                        soundEngine.playClick();
                        router.push(`/problems/${reply.post_id}`);
                      }}
                      className="group py-6 space-y-3 cursor-pointer transition-transform duration-300 hover:translate-x-1"
                    >
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#7c8299] font-sans">
                        <span className="truncate max-w-[360px]">
                          ON QUESTION: {targetPost?.title || 'PROBLEM THREAD'}
                        </span>
                        <span>{formatRelativeTime(reply.created_at)}</span>
                      </div>

                      <p className="font-sans text-[16px] text-[#aab0c4] group-hover:text-[#f2f2f5] transition-colors line-clamp-3 leading-relaxed">
                        &ldquo;{reply.body}&rdquo;
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[12px] pt-1">
                        <span className="inline-flex items-center gap-1.5 text-[#aab0c4]">
                          <Heart size={12} className={reply.like_count > 0 ? 'text-[#e5ab37] fill-[#e5ab37]' : ''} />
                          <span>{reply.like_count} resonance</span>
                        </span>

                        {reply.is_helped && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] font-medium text-[#e5ab37] border border-[#e5ab37]/40 bg-[#e5ab37]/10">
                            <Check size={11} />
                            <span>HELPED THE ASKER (+5 PTS)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center space-y-4 border border-dashed border-white/10 p-8">
                <p className="font-serif text-[22px] text-[#f2f2f5]">
                  No contributions recorded yet.
                </p>
                <p className="font-sans text-[15px] text-[#aab0c4] leading-[1.7] max-w-[440px] mx-auto">
                  Browse open questions asked by others in the sanctuary. Kind, thoughtful advice earns you trust badges and reputation.
                </p>
                <div className="pt-2">
                  <Link
                    href="/problems"
                    className="btn-outline inline-flex items-center gap-2 !h-[46px] !px-6 text-[11px]"
                  >
                    <span>BROWSE OPEN QUESTIONS</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Items */}
        {tab === 'saved' && (
          <div key="tab-saved" className="tab-pane-transition">
            {savedPosts.length > 0 ? (
              <div className="divide-y divide-[rgba(255,255,255,0.10)]">
                {savedPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      soundEngine.playClick();
                      router.push(`/problems/${post.id}`);
                    }}
                    className="
                      group py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 
                      cursor-pointer transition-transform duration-300 hover:translate-x-1
                    "
                  >
                    <div className="space-y-1 pr-4">
                      <h3 className="font-serif text-[22px] sm:text-[26px] text-[#f2f2f5] group-hover:text-white transition-colors truncate max-w-[420px]">
                        {post.title || post.body}
                      </h3>
                      <div className="flex items-center gap-4 text-[13px] text-[#7c8299] font-sans">
                        <span>{formatRelativeTime(post.created_at)}</span>
                        <span>·</span>
                        <span>{post.category}</span>
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-center">
                      <span className="btn-outline inline-flex items-center justify-center !h-[38px] !px-4 text-[11px] group-hover:border-white/60">
                        READ · {post.reply_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-white/10 p-8 space-y-2">
                <p className="font-serif text-[20px] text-[#f2f2f5]">No saved questions yet.</p>
                <p className="font-sans text-[14px] text-[#7c8299]">
                  Tap the bookmark icon on any problem to keep it in your sanctuary profile.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Session / Log Out */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.10)] flex items-center justify-between text-[12px] text-[#7c8299]">
          <span>Signed in as <code className="text-[#aab0c4] font-mono">{user?.email || 'Sanctuary Member'}</code></span>
          <button
            onClick={() => {
              soundEngine.playClick();
              communityStore.logout();
            }}
            className="text-[#7c8299] hover:text-rose-300 transition-colors flex items-center gap-1.5 uppercase tracking-[0.16em]"
          >
            <LogOut size={12} />
            <span>LOG OUT</span>
          </button>
        </div>

      </div>
    </SplitLayout>
  );
}
