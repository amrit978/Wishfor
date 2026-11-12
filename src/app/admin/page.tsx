'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post, Reply, ReportItem } from '@/types';
import { communityStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundscape';
import { SplitLayout } from '@/components/SplitLayout';
import {
  ShieldCheck,
  ShieldAlert,
  Trash2,
  RefreshCw,
  ExternalLink,
  Search,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Lock,
} from 'lucide-react';

type AdminTab = 'posts' | 'replies' | 'reports' | 'profile';
type AuthState = 'loading' | 'authorized' | 'unauthenticated' | 'forbidden';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function AdminConsolePage() {
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthState>('loading');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [tab, setTab] = useState<AdminTab>('posts');

  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [isSupabaseAdminConfigured, setIsSupabaseAdminConfigured] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdminOverview = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const session = await communityStore.syncSession();
      setReports(communityStore.getReports());

      const res = await fetch('/api/admin/posts', { cache: 'no-store' });
      if (res.status === 401) {
        setAdminEmail(session.user?.email || communityStore.getCurrentUser().email || '');
        setAuthState('unauthenticated');
        return;
      }
      if (res.status === 403) {
        setAdminEmail(session.user?.email || communityStore.getCurrentUser().email || '');
        setAuthState('forbidden');
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotice({ type: 'error', text: data.error || 'Failed to load admin overview.' });
        return;
      }

      setAdminEmail(data.adminEmail || session.user?.email || '');
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setReplies(Array.isArray(data.replies) ? data.replies : []);
      setIsSupabaseConfigured(Boolean(data.isSupabaseConfigured));
      setIsSupabaseAdminConfigured(Boolean(data.isSupabaseAdminConfigured));
      setAuthState('authorized');
    } catch {
      setNotice({ type: 'error', text: 'Network error connecting to Admin API.' });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  const handleDeletePost = async (postId: string) => {
    soundEngine.playClick();
    setDeletingKey(`post:${postId}`);
    setNotice(null);

    const res = await communityStore.adminDeletePost(postId);
    setDeletingKey(null);
    setConfirmKey(null);

    if (!res.success) {
      setNotice({
        type: 'error',
        text: res.error || 'Could not delete post from database.',
      });
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setReplies((prev) => prev.filter((r) => r.post_id !== postId));
    setNotice({
      type: 'success',
      text: `Post ${postId} and its replies were permanently deleted.`,
    });
  };

  const handleDeleteReply = async (replyId: string) => {
    soundEngine.playClick();
    setDeletingKey(`reply:${replyId}`);
    setNotice(null);

    const res = await communityStore.adminDeleteReply(replyId);
    setDeletingKey(null);
    setConfirmKey(null);

    if (!res.success) {
      setNotice({
        type: 'error',
        text: res.error || 'Could not delete reply from database.',
      });
      return;
    }

    setReplies((prev) => prev.filter((r) => r.id !== replyId && r.parent_reply_id !== replyId));
    setNotice({
      type: 'success',
      text: `Reply ${replyId} was permanently deleted.`,
    });
  };

  const handleResolveReport = (
    report: ReportItem,
    action: 'dismiss' | 'hide_content'
  ) => {
    soundEngine.playClick();
    communityStore.resolveReport(report.id, action);
    setReports(communityStore.getReports());
  };

  const handleEraseReportedTarget = async (report: ReportItem) => {
    soundEngine.playClick();
    if (report.target_type === 'post') {
      await handleDeletePost(report.target_id);
    } else {
      await handleDeleteReply(report.target_id);
    }
    communityStore.resolveReport(report.id, 'penalize_and_hide');
    setReports(communityStore.getReports());
  };

  const handleLogout = () => {
    soundEngine.playClick();
    communityStore.logout();
    router.push('/auth?redirect=/admin');
  };

  if (authState === 'loading') {
    return (
      <SplitLayout eyebrow="ADMINISTRATION" title="Verifying Admin Session">
        <div className="py-12 space-y-4 max-w-[520px]">
          <p className="font-sans text-[16px] text-[#aab0c4]">
            Checking signed HTTP-only administrator credentials...
          </p>
        </div>
      </SplitLayout>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <SplitLayout eyebrow="ADMIN PROFILE" title="Admin Authentication Required">
        <div className="space-y-8 max-w-[560px]">
          <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
            Only a verified administrator session can permanently manage or delete live Sanctuary posts.
            {adminEmail ? ` Currently detected email (${adminEmail}) does not have an active verified cookie in this browser.` : ''}
          </p>

          <div className="border border-[#e5ab37]/30 bg-[#e5ab37]/5 p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#e5ab37] font-semibold">
              <Lock size={14} />
              <span>PROTECTED SANCTUARY CONSOLE</span>
            </div>
            <p className="font-sans text-[15px] text-[#aab0c4] leading-relaxed">
              Sign in with your configured admin email via 6-digit Email OTP. Once verified, a signed HTTP-only session cookie unlocks permanent post and reply deletion across the database.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/auth?redirect=/admin"
                className="btn-outline !border-[#e5ab37]/60 !text-[#e5ab37] hover:!bg-[#e5ab37]/10 !h-[48px] !px-7 inline-flex items-center gap-2 text-[12px]"
              >
                <span>SIGN IN WITH ADMIN EMAIL →</span>
              </Link>
              <Link
                href="/problems"
                className="text-[11px] uppercase tracking-[0.18em] text-[#7c8299] hover:text-[#f2f2f5] transition-colors"
              >
                BACK TO PROBLEMS
              </Link>
            </div>
          </div>
        </div>
      </SplitLayout>
    );
  }

  if (authState === 'forbidden') {
    return (
      <SplitLayout eyebrow="ACCESS RESTRICTED" title="Admin Privileges Required">
        <div className="space-y-8 max-w-[560px]">
          <p className="font-sans text-[17px] text-[#aab0c4] leading-[1.75]">
            You are signed in as <span className="text-[#f2f2f5] font-medium">{adminEmail || 'a regular member'}</span>, which does not have Sanctuary Admin permissions.
          </p>

          <div className="border border-red-400/30 bg-red-500/5 p-6 space-y-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#e2869a] font-semibold">
              <ShieldAlert size={14} />
              <span>UNAUTHORIZED ACCOUNT</span>
            </div>
            <p className="font-sans text-[14px] text-[#aab0c4] leading-relaxed">
              Sign out and verify using the Sanctuary Admin email configured in <code className="text-[#f2f2f5]">ADMIN_EMAILS</code>.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleLogout}
                className="btn-outline !h-[44px] !px-6 inline-flex items-center gap-2 text-[11px]"
              >
                <LogOut size={13} />
                <span>SIGN OUT & SWITCH TO ADMIN</span>
              </button>
              <Link
                href="/my-space"
                className="text-[11px] uppercase tracking-[0.18em] text-[#7c8299] hover:text-[#f2f2f5]"
              >
                RETURN TO MY SPACE
              </Link>
            </div>
          </div>
        </div>
      </SplitLayout>
    );
  }

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
  const q = searchQuery.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    if (categoryFilter !== 'ALL' && post.category !== categoryFilter) return false;
    if (urgentOnly && !post.is_urgent && !post.crisis_flagged) return false;
    if (!q) return true;
    return (
      post.id.toLowerCase().includes(q) ||
      (post.title || '').toLowerCase().includes(q) ||
      post.body.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.mask_name.toLowerCase().includes(q)
    );
  });

  const filteredReplies = replies.filter((reply) => {
    if (!q) return true;
    return (
      reply.id.toLowerCase().includes(q) ||
      reply.post_id.toLowerCase().includes(q) ||
      reply.body.toLowerCase().includes(q) ||
      reply.mask_name.toLowerCase().includes(q)
    );
  });

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const urgentCount = posts.filter((p) => p.is_urgent || p.crisis_flagged).length;

  return (
    <div className="min-h-screen w-full bg-[#0c0d14] text-[#f2f2f5] pt-28 pb-24 px-6 sm:px-10 md:px-16">
      <div className="max-w-[1120px] mx-auto space-y-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#e5ab37] font-semibold">
              <ShieldCheck size={14} />
              <span>ADMINISTRATION // SANCTUARY CONTROL</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#f2f2f5] tracking-tight">
              Admin Console
            </h1>
            <p className="font-sans text-[14px] text-[#7c8299]">
              Signed in as <span className="text-[#f2f2f5] font-medium">{adminEmail}</span> · Full moderation & deletion authority
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAdminOverview}
              disabled={isRefreshing}
              className="btn-outline !h-[42px] !px-5 inline-flex items-center gap-2 text-[11px]"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'SYNCING...' : 'REFRESH LEDGER'}</span>
            </button>
            <Link
              href="/problems"
              className="btn-outline !h-[42px] !px-5 inline-flex items-center gap-2 text-[11px]"
            >
              <span>PUBLIC PROBLEMS</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Supabase Service Role Warning Banner */}
        {isSupabaseConfigured && !isSupabaseAdminConfigured && (
          <div className="border border-[#e5ab37]/50 bg-[#e5ab37]/10 p-5 sm:p-6 space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#e5ab37] font-semibold">
              <AlertTriangle size={15} />
              <span>ACTION NEEDED FOR PERMANENT DATABASE DELETION</span>
            </div>
            <p className="font-sans text-[14px] text-[#f2f2f5]/90 leading-relaxed">
              Supabase Row-Level Security blocks public keys from deleting posts. Add your secret <code className="px-1.5 py-0.5 bg-black/40 text-[#e5ab37]">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel Environment Variables (and <code className="px-1.5 py-0.5 bg-black/40 text-[#e5ab37]">.env.local</code> locally), then redeploy so Admin deletions erase posts permanently for every user.
            </p>
          </div>
        )}

        {/* Operation Feedback Notice */}
        {notice && (
          <div
            className={`p-4 border flex items-start justify-between gap-4 font-sans text-[14px] ${
              notice.type === 'success'
                ? 'border-[#7ec89f]/40 bg-[#7ec89f]/10 text-[#7ec89f]'
                : 'border-red-400/40 bg-red-500/10 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{notice.text}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-[11px] uppercase tracking-[0.18em] opacity-75 hover:opacity-100"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-white/10 bg-[#13151f] p-5 space-y-1.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">PUBLISHED POSTS</div>
            <div className="font-serif text-3xl text-[#f2f2f5]">{posts.length}</div>
          </div>
          <div className="border border-white/10 bg-[#13151f] p-5 space-y-1.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">URGENT / CRISIS</div>
            <div className="font-serif text-3xl text-[#e2869a]">{urgentCount}</div>
          </div>
          <div className="border border-white/10 bg-[#13151f] p-5 space-y-1.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">TOTAL REPLIES</div>
            <div className="font-serif text-3xl text-[#f2f2f5]">{replies.length}</div>
          </div>
          <div className="border border-white/10 bg-[#13151f] p-5 space-y-1.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#7c8299]">PENDING REPORTS</div>
            <div className="font-serif text-3xl text-[#e5ab37]">{pendingReportsCount}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          {(
            [
              { id: 'posts', label: `POSTS LEDGER (${posts.length})` },
              { id: 'replies', label: `REPLIES (${replies.length})` },
              { id: 'reports', label: `REPORTS (${pendingReportsCount})` },
              { id: 'profile', label: 'ADMIN PROFILE & DIAGNOSTICS' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                soundEngine.playClick();
                setTab(item.id);
                setConfirmKey(null);
              }}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-medium border transition-colors ${
                tab === item.id
                  ? 'border-[#e5ab37]/60 bg-[#e5ab37]/10 text-[#e5ab37]'
                  : 'border-transparent text-[#7c8299] hover:text-[#f2f2f5]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search & Filters for Posts / Replies */}
        {(tab === 'posts' || tab === 'replies') && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-[460px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c8299]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tab === 'posts' ? 'Search posts by title, content, category, or ID...' : 'Search replies by content or post ID...'}
                className="w-full bg-[#13151f] border border-white/15 pl-9 pr-4 py-2.5 text-[14px] text-[#f2f2f5] placeholder:text-[#7c8299] focus:outline-none focus:border-[#e5ab37]/60"
              />
            </div>

            {tab === 'posts' && (
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#13151f] border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[#f2f2f5] focus:outline-none"
                >
                  <option value="ALL">ALL CATEGORIES</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setUrgentOnly((v) => !v)}
                  className={`px-3 py-2 text-[11px] uppercase tracking-[0.16em] border transition-colors ${
                    urgentOnly
                      ? 'border-[#e2869a]/60 bg-[#e2869a]/10 text-[#e2869a]'
                      : 'border-white/15 text-[#7c8299] hover:text-[#f2f2f5]'
                  }`}
                >
                  URGENT / CRISIS ONLY
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: POSTS LEDGER */}
        {tab === 'posts' && (
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="border border-white/10 bg-[#13151f] p-10 text-center text-[#7c8299] font-sans text-[15px]">
                No matching posts in the live ledger.
              </div>
            ) : (
              filteredPosts.map((post) => {
                const key = `post:${post.id}`;
                const isConfirming = confirmKey === key;
                const isDeleting = deletingKey === key;

                return (
                  <div
                    key={post.id}
                    className="border border-white/10 bg-[#13151f] p-5 sm:p-6 flex flex-col md:flex-row md:items-start justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 text-[10px] uppercase tracking-[0.18em]">
                        <span className="px-2 py-0.5 border border-white/15 text-[#aab0c4]">
                          {post.category}
                        </span>
                        {post.is_urgent && (
                          <span className="px-2 py-0.5 border border-[#e5ab37]/50 text-[#e5ab37] bg-[#e5ab37]/10">
                            URGENT
                          </span>
                        )}
                        {post.crisis_flagged && (
                          <span className="px-2 py-0.5 border border-[#e2869a]/50 text-[#e2869a] bg-[#e2869a]/10">
                            CRISIS MARKER
                          </span>
                        )}
                        <span className="text-[#7c8299]">
                          {post.mask_name} · {formatRelativeTime(post.created_at)} · {post.reply_count} replies
                        </span>
                      </div>

                      {post.title && (
                        <h3 className="font-serif text-xl sm:text-2xl text-[#f2f2f5] break-words">
                          {post.title}
                        </h3>
                      )}

                      <p className="font-sans text-[14px] sm:text-[15px] text-[#aab0c4] leading-relaxed whitespace-pre-wrap break-words">
                        {post.body}
                      </p>

                      <div className="text-[11px] font-mono text-[#7c8299]">
                        ID: {post.id}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 shrink-0">
                      <Link
                        href={`/problems/${post.id}`}
                        className="px-3.5 py-2 border border-white/15 hover:border-white/40 text-[11px] uppercase tracking-[0.16em] text-[#aab0c4] hover:text-[#f2f2f5] inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>VIEW THREAD</span>
                        <ExternalLink size={12} />
                      </Link>

                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={isDeleting}
                            className="px-3.5 py-2 bg-red-500/20 border border-red-400 text-red-200 hover:bg-red-500/30 text-[11px] uppercase tracking-[0.16em] font-semibold transition-colors"
                          >
                            {isDeleting ? 'DELETING...' : 'CONFIRM ERASE'}
                          </button>
                          <button
                            onClick={() => setConfirmKey(null)}
                            disabled={isDeleting}
                            className="px-3 py-2 border border-white/15 text-[#7c8299] hover:text-[#f2f2f5] text-[11px] uppercase tracking-[0.16em]"
                          >
                            CANCEL
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmKey(key)}
                          className="px-3.5 py-2 border border-red-400/40 text-red-300 hover:bg-red-500/15 text-[11px] uppercase tracking-[0.16em] inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 size={13} />
                          <span>DELETE POST</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: REPLIES */}
        {tab === 'replies' && (
          <div className="space-y-4">
            {filteredReplies.length === 0 ? (
              <div className="border border-white/10 bg-[#13151f] p-10 text-center text-[#7c8299] font-sans text-[15px]">
                No matching replies found.
              </div>
            ) : (
              filteredReplies.map((reply) => {
                const key = `reply:${reply.id}`;
                const isConfirming = confirmKey === key;
                const isDeleting = deletingKey === key;

                return (
                  <div
                    key={reply.id}
                    className="border border-white/10 bg-[#13151f] p-5 flex flex-col md:flex-row md:items-start justify-between gap-5"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#7c8299]">
                        <span className="text-[#f2f2f5]">{reply.mask_name}</span>
                        {reply.is_asker && (
                          <span className="px-2 py-0.5 border border-[#7ec89f]/40 text-[#7ec89f]">
                            ASKER
                          </span>
                        )}
                        <span>· {formatRelativeTime(reply.created_at)}</span>
                        <span>· Post: {reply.post_id}</span>
                      </div>

                      <p className="font-sans text-[14px] text-[#aab0c4] leading-relaxed whitespace-pre-wrap break-words">
                        {reply.body}
                      </p>

                      <div className="text-[11px] font-mono text-[#7c8299]">
                        Reply ID: {reply.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Link
                        href={`/problems/${reply.post_id}`}
                        className="px-3 py-1.5 border border-white/15 hover:border-white/40 text-[11px] uppercase tracking-[0.16em] text-[#aab0c4] hover:text-[#f2f2f5] inline-flex items-center gap-1"
                      >
                        <span>THREAD</span>
                        <ExternalLink size={11} />
                      </Link>

                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 bg-red-500/20 border border-red-400 text-red-200 text-[11px] uppercase tracking-[0.16em] font-semibold"
                          >
                            {isDeleting ? 'DELETING...' : 'CONFIRM'}
                          </button>
                          <button
                            onClick={() => setConfirmKey(null)}
                            disabled={isDeleting}
                            className="px-2.5 py-1.5 border border-white/15 text-[#7c8299] text-[11px] uppercase tracking-[0.16em]"
                          >
                            CANCEL
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmKey(key)}
                          className="px-3 py-1.5 border border-red-400/40 text-red-300 hover:bg-red-500/15 text-[11px] uppercase tracking-[0.16em] inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>DELETE</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: REPORTS */}
        {tab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="border border-white/10 bg-[#13151f] p-10 text-center text-[#7c8299] font-sans text-[15px]">
                No reports currently queued in this browser session.
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-white/10 bg-[#13151f] p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
                      <span
                        className={`px-2 py-0.5 border ${
                          report.status === 'pending'
                            ? 'border-[#e5ab37]/50 text-[#e5ab37] bg-[#e5ab37]/10'
                            : 'border-white/15 text-[#7c8299]'
                        }`}
                      >
                        {report.status}
                      </span>
                      <span className="text-[#aab0c4]">
                        {report.target_type} · {report.reason}
                      </span>
                      <span className="text-[#7c8299]">{formatRelativeTime(report.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(report, 'dismiss')}
                            className="px-3 py-1.5 border border-white/15 text-[11px] uppercase tracking-[0.16em] text-[#aab0c4] hover:text-[#f2f2f5]"
                          >
                            DISMISS
                          </button>
                          <button
                            onClick={() => handleEraseReportedTarget(report)}
                            className="px-3 py-1.5 border border-red-400/40 text-red-300 hover:bg-red-500/15 text-[11px] uppercase tracking-[0.16em] inline-flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            <span>ERASE TARGET</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {report.target_preview && (
                    <p className="font-sans text-[14px] text-[#aab0c4] border-l-2 border-white/15 pl-3">
                      {report.target_preview}
                    </p>
                  )}

                  {report.details && (
                    <p className="font-sans text-[13px] text-[#7c8299]">
                      Note: {report.details}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: ADMIN PROFILE & SYSTEM DIAGNOSTICS */}
        {tab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-white/10 bg-[#13151f] p-6 space-y-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#e5ab37] font-semibold">
                ADMIN PROFILE IDENTITY
              </div>
              <div className="space-y-3 font-sans text-[14px]">
                <div className="flex justify-between gap-4 py-2 border-b border-white/10">
                  <span className="text-[#7c8299]">Verified Email</span>
                  <span className="text-[#f2f2f5] font-medium">{adminEmail}</span>
                </div>
                <div className="flex justify-between gap-4 py-2 border-b border-white/10">
                  <span className="text-[#7c8299]">Privilege Role</span>
                  <span className="text-[#e5ab37] uppercase tracking-[0.16em] text-[11px] font-semibold">
                    SANCTUARY ADMIN
                  </span>
                </div>
                <div className="flex justify-between gap-4 py-2 border-b border-white/10">
                  <span className="text-[#7c8299]">Session Cookie</span>
                  <span className="text-[#7ec89f] uppercase tracking-[0.16em] text-[11px]">
                    ACTIVE (HTTP-ONLY)
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn-outline !h-[42px] !px-5 inline-flex items-center gap-2 text-[11px] text-[#e2869a] border-[#e2869a]/40 hover:bg-[#e2869a]/10"
              >
                <LogOut size={13} />
                <span>SIGN OUT OF ADMIN SESSION</span>
              </button>
            </div>

            <div className="border border-white/10 bg-[#13151f] p-6 space-y-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#aab0c4] font-semibold">
                BACKEND & MODERATION DIAGNOSTICS
              </div>
              <div className="space-y-3 font-sans text-[14px]">
                <div className="flex justify-between gap-4 py-2 border-b border-white/10">
                  <span className="text-[#7c8299]">Supabase Public Ledger</span>
                  <span className={isSupabaseConfigured ? 'text-[#7ec89f]' : 'text-[#e5ab37]'}>
                    {isSupabaseConfigured ? 'CONNECTED' : 'MEMORY FALLBACK'}
                  </span>
                </div>
                <div className="flex justify-between gap-4 py-2 border-b border-white/10">
                  <span className="text-[#7c8299]">Supabase Service Role Delete</span>
                  <span className={isSupabaseAdminConfigured ? 'text-[#7ec89f]' : 'text-[#e2869a]'}>
                    {isSupabaseAdminConfigured ? 'ARMED (PERMANENT DELETE)' : 'KEY NOT CONFIGURED'}
                  </span>
                </div>
                <div className="flex justify-between gap-4 py-2 border-b border-white/10">
                  <span className="text-[#7c8299]">Content Safety Filters</span>
                  <span className="text-[#7ec89f]">Doxxing + Abuse/Slurs + Crisis</span>
                </div>
              </div>
              <p className="font-sans text-[13px] text-[#7c8299] leading-relaxed">
                Tip: You can also delete any individual post or reply directly while browsing any thread page under <code className="text-[#f2f2f5]">/problems/[id]</code> whenever signed in as Admin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

