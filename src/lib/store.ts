'use client';

import { Post, Reply, CurrentUser, Category, NotificationItem, ReportItem, ReportReason } from '@/types';
import { INITIAL_POSTS, INITIAL_REPLIES, INITIAL_USERS } from './initialData';
import { getMaskForThread, getTrustLevel } from './anonymity';
import { checkDoxxing, detectCrisis } from './safety';
import { soundEngine } from './soundscape';

const STORAGE_KEYS = {
  POSTS: 'wishfor_posts_v5',
  REPLIES: 'wishfor_replies_v5',
  CURRENT_USER: 'wishfor_user_v5',
  BOOKMARKS: 'wishfor_bookmarks_v5',
  NOTIFICATIONS: 'wishfor_notifs_v5',
  REPORTS: 'wishfor_reports_v5',
  LIKED_REPLIES: 'wishfor_likes_v5',
  LAST_POST_TIME: 'wishfor_last_post_v5',
};

class CommunityStore {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  public isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!saved) return false;
    try {
      const user: CurrentUser = JSON.parse(saved);
      return Boolean(user && user.is_authenticated && (user.email || user.phone));
    } catch (e) {
      return false;
    }
  }

  public getCurrentUser(): CurrentUser {
    const fallback: CurrentUser = {
      id: 'anon_guest',
      trust_score: 0,
      trust_level: 'Newcomer',
      role: 'user',
      is_banned: false,
      is_authenticated: false,
    };

    if (!this.isBrowser()) {
      return fallback;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const newUser: CurrentUser = {
      id: `anon_${Math.random().toString(36).substring(2, 10)}`,
      trust_score: 0,
      trust_level: 'Newcomer',
      role: 'user',
      is_banned: false,
      is_authenticated: false,
    };
    this.saveCurrentUser(newUser);
    return newUser;
  }

  public saveCurrentUser(user: CurrentUser): void {
    if (!this.isBrowser()) return;
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : undefined;
    const sanitized: CurrentUser = {
      ...user,
      email: cleanEmail,
      is_authenticated: Boolean(user.is_authenticated ?? (cleanEmail || user.phone)),
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sanitized));

    // If logging in with email, backfill author_email on any posts/replies authored by this user
    if (cleanEmail) {
      try {
        const rawPosts = this.getRawPosts();
        let postsChanged = false;
        const updatedPosts = rawPosts.map((p) => {
          if ((p.author_id === sanitized.id || p.author_email?.toLowerCase() === cleanEmail) && !p.author_email) {
            postsChanged = true;
            return { ...p, author_email: cleanEmail, author_id: sanitized.id };
          }
          return p;
        });
        if (postsChanged) {
          localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedPosts));
        }

        const rawReplies = this.getRawReplies();
        let repliesChanged = false;
        const updatedReplies = rawReplies.map((r) => {
          if ((r.author_id === sanitized.id || r.author_email?.toLowerCase() === cleanEmail) && !r.author_email) {
            repliesChanged = true;
            return { ...r, author_email: cleanEmail, author_id: sanitized.id };
          }
          return r;
        });
        if (repliesChanged) {
          localStorage.setItem(STORAGE_KEYS.REPLIES, JSON.stringify(updatedReplies));
        }
      } catch (err) {}
    }

    this.notifyListeners();
  }

  public logout(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    // Clear verification cookie if present
    document.cookie = 'wishfor_otp_ticket=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    this.notifyListeners();
  }

  public switchRole(role: 'user' | 'moderator'): CurrentUser {
    const user = this.getCurrentUser();
    user.role = role;
    this.saveCurrentUser(user);
    this.notifyListeners();
    return user;
  }

  public seedDevData(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
    localStorage.setItem(STORAGE_KEYS.REPLIES, JSON.stringify(INITIAL_REPLIES));
    this.notifyListeners();
  }

  public clearAll(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.POSTS);
    localStorage.removeItem(STORAGE_KEYS.REPLIES);
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.LIKED_REPLIES);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notifyListeners();
  }

  private getRawPosts(): Post[] {
    const isDevSeed = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEV_SEED === 'true';
    let posts: Post[] = isDevSeed ? INITIAL_POSTS : [];
    if (this.isBrowser()) {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        try {
          posts = JSON.parse(stored);
        } catch (e) {}
      }
    }
    return posts;
  }

  private getRawReplies(): Reply[] {
    const isDevSeed = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEV_SEED === 'true';
    let replies: Reply[] = isDevSeed ? INITIAL_REPLIES : [];
    if (!this.isBrowser()) return replies;
    const stored = localStorage.getItem(STORAGE_KEYS.REPLIES);
    if (!stored) return replies;
    try {
      return JSON.parse(stored);
    } catch (e) {
      return replies;
    }
  }

  public getPosts(): Post[] {
    const posts = this.getRawPosts();
    const bookmarks = this.getBookmarks();
    const user = this.getCurrentUser();
    const isAuth = this.isAuthenticated();
    const userEmail = (user.email || '').toLowerCase().trim();

    return posts
      .map((p) => {
        const isAuthor = Boolean(
          isAuth &&
            ((userEmail && p.author_email && p.author_email.toLowerCase() === userEmail) ||
              (user.id && p.author_id && p.author_id === user.id))
        );
        return {
          ...p,
          is_author: isAuthor,
          is_saved: bookmarks.includes(p.id),
        };
      })
      .filter((p) => p.status === 'published' || (p.status === 'draft' && p.is_author));
  }

  public savePosts(posts: Post[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notifyListeners();
  }

  public getPostById(id: string): Post | undefined {
    return this.getPosts().find((p) => p.id === id);
  }

  public checkPostCooldown(): { allowed: boolean; waitSeconds?: number } {
    if (!this.isBrowser()) return { allowed: true };
    const last = localStorage.getItem(STORAGE_KEYS.LAST_POST_TIME);
    if (!last) return { allowed: true };

    const diff = Date.now() - parseInt(last, 10);
    const cooldownMs = 15 * 1000; // 15s cooldown
    if (diff < cooldownMs) {
      return { allowed: false, waitSeconds: Math.ceil((cooldownMs - diff) / 1000) };
    }
    return { allowed: true };
  }

  public createPost(data: {
    title?: string;
    body: string;
    category: Category;
    is_urgent?: boolean;
    is_draft?: boolean;
  }): { success: boolean; post?: Post; error?: string; crisisDetected?: boolean } {
    const user = this.getCurrentUser();
    if (user.is_banned) {
      return { success: false, error: 'Your transmission permissions have been restricted.' };
    }

    if (!data.is_draft) {
      const cooldown = this.checkPostCooldown();
      if (!cooldown.allowed) {
        return {
          success: false,
          error: `Signal throttle active. Please wait ${cooldown.waitSeconds}s before releasing another transmission.`,
        };
      }
    }

    const doxxing = checkDoxxing(`${data.title || ''} ${data.body}`);
    if (doxxing.isBlocked) {
      return { success: false, error: doxxing.reason };
    }

    const crisis = detectCrisis(`${data.title || ''} ${data.body}`);

    const postId = `post_${Date.now()}`;
    const threadMask = getMaskForThread(user.id, postId, true);
    const freqCode = ((Math.abs(Date.now()) % 899) + 100) / 10;

    const newPost: Post = {
      id: postId,
      category: data.category,
      title: data.title?.trim() || undefined,
      body: data.body.trim(),
      is_urgent: !!data.is_urgent,
      status: data.is_draft ? 'draft' : 'published',
      report_count: 0,
      reply_count: 0,
      helped_reply_id: null,
      crisis_flagged: crisis.hasCrisisSignals,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mask_name: threadMask.mask_name,
      mask_seed: threadMask.mask_seed,
      is_asker: true,
      trust_level: user.trust_level,
      is_author: true,
      author_id: user.id,
      author_email: user.email ? user.email.toLowerCase().trim() : undefined,
      coordinates: `FREQ // ${freqCode.toFixed(1)}${data.is_urgent ? ' [PRIORITY]' : ''}`,
    };

    const currentPosts = this.getPosts();
    this.savePosts([newPost, ...currentPosts]);

    if (!data.is_draft && this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.LAST_POST_TIME, Date.now().toString());
    }

    soundEngine.playResonance();
    return { success: true, post: newPost, crisisDetected: crisis.hasCrisisSignals };
  }

  public deletePost(postId: string): boolean {
    const posts = this.getPosts().filter((p) => p.id !== postId);
    this.savePosts(posts);

    let replies = this.getAllReplies().filter((r) => r.post_id !== postId);
    this.saveReplies(replies);
    return true;
  }

  public getRepliesForPost(postId: string): Reply[] {
    const post = this.getPostById(postId);
    const allReplies = this.getAllReplies();
    const likedSet = this.getLikedReplyIds();

    const postReplies = allReplies
      .filter((r) => r.post_id === postId && r.status === 'published')
      .map((r) => ({
        ...r,
        has_liked: likedSet.has(r.id),
      }));

    const topLevel: Reply[] = [];
    const subRepliesMap = new Map<string, Reply[]>();

    postReplies.forEach((reply) => {
      if (reply.parent_reply_id) {
        const list = subRepliesMap.get(reply.parent_reply_id) || [];
        list.push(reply);
        subRepliesMap.set(reply.parent_reply_id, list);
      } else {
        topLevel.push(reply);
      }
    });

    topLevel.forEach((parent) => {
      const subs = subRepliesMap.get(parent.id) || [];
      subs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      parent.sub_replies = subs;
    });

    // Pinned helped reply first, then by likes descending, ties by newest
    topLevel.sort((a, b) => {
      const isAHelped = a.id === post?.helped_reply_id || a.is_helped;
      const isBHelped = b.id === post?.helped_reply_id || b.is_helped;
      if (isAHelped && !isBHelped) return -1;
      if (!isAHelped && isBHelped) return 1;

      if (b.like_count !== a.like_count) {
        return b.like_count - a.like_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return topLevel;
  }

  public getAllReplies(): Reply[] {
    const replies = this.getRawReplies();
    const user = this.getCurrentUser();
    const isAuth = this.isAuthenticated();
    const userEmail = (user.email || '').toLowerCase().trim();

    return replies.map((r) => {
      const isAuthor = Boolean(
        isAuth &&
          ((userEmail && r.author_email && r.author_email.toLowerCase() === userEmail) ||
            (user.id && r.author_id && r.author_id === user.id))
      );
      return {
        ...r,
        is_author: isAuthor,
      };
    });
  }

  public saveReplies(replies: Reply[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.REPLIES, JSON.stringify(replies));
    this.notifyListeners();
  }

  public createReply(postId: string, body: string, parentReplyId?: string | null): {
    success: boolean;
    reply?: Reply;
    error?: string;
  } {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Sign in to leave a suggestion.' };
    }

    const user = this.getCurrentUser();
    if (user.is_banned) {
      return { success: false, error: 'Transmission capability restricted.' };
    }

    const trimmed = body.trim();
    if (!trimmed) {
      return { success: false, error: 'Advice cannot be empty.' };
    }
    if (trimmed.length > 2000) {
      return { success: false, error: 'Please keep response within 2000 characters.' };
    }

    const doxxing = checkDoxxing(trimmed);
    if (doxxing.isBlocked) {
      return { success: false, error: doxxing.reason };
    }

    const post = this.getPostById(postId);
    if (!post) {
      return { success: false, error: 'Transmission thread has terminated.' };
    }

    const isAsker = Boolean(post.is_author);
    if (isAsker && !parentReplyId) {
      return {
        success: false,
        error: 'You are the author of this problem. You cannot submit suggestions to your own question.',
      };
    }
    const mask = getMaskForThread(user.id, postId, isAsker);

    const replyId = `reply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReply: Reply = {
      id: replyId,
      post_id: postId,
      parent_reply_id: parentReplyId || null,
      body: trimmed,
      like_count: 0,
      is_helped: false,
      status: 'published',
      report_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mask_name: isAsker ? post.mask_name : mask.mask_name,
      mask_seed: isAsker ? post.mask_seed : mask.mask_seed,
      is_asker: isAsker,
      trust_level: user.trust_level,
      is_author: true,
      author_id: user.id,
      author_email: user.email ? user.email.toLowerCase().trim() : undefined,
      has_liked: false,
    };

    const allReplies = this.getAllReplies();
    this.saveReplies([...allReplies, newReply]);

    const allPosts = this.getPosts().map((p) => {
      if (p.id === postId) {
        return { ...p, reply_count: p.reply_count + 1 };
      }
      return p;
    });
    this.savePosts(allPosts);

    // +1 trust point for clean advice
    this.awardTrustPoints(1);

    if (!isAsker) {
      this.addNotification({
        user_id: 'asker',
        type: 'reply_received',
        post_id: postId,
        reply_id: replyId,
        message: 'An anonymous peer submitted a thoughtful response on your signal.',
      });
    }

    soundEngine.playResonance();
    return { success: true, reply: newReply };
  }

  public deleteReply(replyId: string): boolean {
    const all = this.getAllReplies();
    const target = all.find((r) => r.id === replyId);
    if (!target) return false;

    const remaining = all.filter((r) => r.id !== replyId && r.parent_reply_id !== replyId);
    this.saveReplies(remaining);

    const allPosts = this.getPosts().map((p) => {
      if (p.id === target.post_id) {
        return { ...p, reply_count: Math.max(0, p.reply_count - 1) };
      }
      return p;
    });
    this.savePosts(allPosts);
    return true;
  }

  public toggleLikeReply(replyId: string): { success: boolean; liked: boolean; likeCount: number; error?: string } {
    const likedSet = this.getLikedReplyIds();
    const allReplies = this.getAllReplies();
    const reply = allReplies.find((r) => r.id === replyId);

    if (!reply) return { success: false, liked: false, likeCount: 0, error: 'Reply not found' };

    if (reply.is_author) {
      return { success: false, liked: false, likeCount: reply.like_count, error: 'Self-resonance is restricted.' };
    }

    let isLikedNow = false;
    let newLikeCount = reply.like_count;

    if (likedSet.has(replyId)) {
      likedSet.delete(replyId);
      newLikeCount = Math.max(0, reply.like_count - 1);
      isLikedNow = false;
    } else {
      likedSet.add(replyId);
      newLikeCount = reply.like_count + 1;
      isLikedNow = true;

      this.addNotification({
        user_id: 'replier',
        type: 'like_received',
        post_id: reply.post_id,
        reply_id: reply.id,
        message: 'A peer signaled deep resonance with your advice (+1 trust).',
      });
      soundEngine.playResonance();
    }

    this.saveLikedReplyIds(likedSet);

    const updated = allReplies.map((r) => (r.id === replyId ? { ...r, like_count: newLikeCount } : r));
    this.saveReplies(updated);

    return { success: true, liked: isLikedNow, likeCount: newLikeCount };
  }

  private getLikedReplyIds(): Set<string> {
    if (!this.isBrowser()) return new Set();
    const stored = localStorage.getItem(STORAGE_KEYS.LIKED_REPLIES);
    if (!stored) return new Set();
    try {
      return new Set(JSON.parse(stored));
    } catch (e) {
      return new Set();
    }
  }

  private saveLikedReplyIds(set: Set<string>): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.LIKED_REPLIES, JSON.stringify(Array.from(set)));
  }

  public markReplyAsHelped(postId: string, replyId: string): boolean {
    const posts = this.getPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) return false;

    // Prevent author from marking their own reply as helped
    const allExisting = this.getAllReplies();
    const targetReply = allExisting.find((r) => r.id === replyId);
    if (!targetReply || targetReply.is_author) {
      return false;
    }

    const isAlreadyHelped = post.helped_reply_id === replyId;
    const newHelpedId = isAlreadyHelped ? null : replyId;

    const updatedPosts = posts.map((p) => (p.id === postId ? { ...p, helped_reply_id: newHelpedId } : p));
    this.savePosts(updatedPosts);

    const allReplies = this.getAllReplies().map((r) => {
      if (r.post_id === postId) {
        return { ...r, is_helped: r.id === newHelpedId };
      }
      return r;
    });
    this.saveReplies(allReplies);

    if (newHelpedId) {
      this.awardTrustPoints(5);
      this.addNotification({
        user_id: 'replier',
        type: 'helped_marked',
        post_id: postId,
        reply_id: replyId,
        message: 'The author designated your advice as "Helped Me Most" (+5 Trust Points).',
      });
      soundEngine.playResonance();
    }

    return true;
  }

  private awardTrustPoints(points: number): void {
    const user = this.getCurrentUser();
    user.trust_score = Math.max(0, user.trust_score + points);
    user.trust_level = getTrustLevel(user.trust_score);
    this.saveCurrentUser(user);
  }

  public getBookmarks(): string[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  public toggleBookmark(postId: string): boolean {
    const bookmarks = new Set(this.getBookmarks());
    let isSaved = false;
    if (bookmarks.has(postId)) {
      bookmarks.delete(postId);
      isSaved = false;
    } else {
      bookmarks.add(postId);
      isSaved = true;
      soundEngine.playClick();
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(Array.from(bookmarks)));
    }
    this.notifyListeners();
    return isSaved;
  }

  public getNotifications(): NotificationItem[] {
    if (!this.isBrowser()) {
      return [
        {
          id: 'notif_1',
          user_id: 'user_1',
          type: 'helped_marked',
          post_id: 'post_1',
          reply_id: 'reply_1_1',
          message: 'The author designated your advice as "Helped Me Most" (+5 Trust Points).',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
      ];
    }
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!stored) {
      return [
        {
          id: 'notif_1',
          user_id: 'user_1',
          type: 'helped_marked',
          post_id: 'post_1',
          reply_id: 'reply_1_1',
          message: 'The author designated your advice as "Helped Me Most" (+5 Trust Points).',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
      ];
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>): void {
    if (!this.isBrowser()) return;
    const all = this.getNotifications();
    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([newNotif, ...all]));
    this.notifyListeners();
  }

  public markAllNotificationsAsRead(): void {
    if (!this.isBrowser()) return;
    const all = this.getNotifications().map((n) => ({ ...n, is_read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notifyListeners();
  }

  public getReports(): ReportItem[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!stored) {
      return [
        {
          id: 'rep_1',
          target_type: 'post',
          target_id: 'post_10',
          reason: 'unsafe_advice',
          details: 'Contains acute distress markers; verify automated crisis hotline card is attached.',
          status: 'pending',
          created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          target_preview: 'I don\'t want to harm anyone. I just need this unrelenting buzzing static in my skull to finally go quiet...',
          category: 'Mental Health',
        },
      ];
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  public createReport(data: {
    target_type: 'post' | 'reply';
    target_id: string;
    reason: ReportReason;
    details?: string;
  }): { success: boolean } {
    const reports = this.getReports();
    let preview = '';
    let category: Category | undefined;

    if (data.target_type === 'post') {
      const p = this.getPostById(data.target_id);
      if (p) {
        preview = p.title || p.body.substring(0, 80);
        category = p.category;
        p.report_count += 1;
        if (p.report_count >= 3) {
          p.status = 'hidden_by_reports';
        }
        this.savePosts(this.getPosts().map((item) => (item.id === p.id ? p : item)));
      }
    } else {
      const r = this.getAllReplies().find((item) => item.id === data.target_id);
      if (r) {
        preview = r.body.substring(0, 80);
        r.report_count += 1;
        if (r.report_count >= 3) {
          r.status = 'hidden_by_reports';
        }
        this.saveReplies(this.getAllReplies().map((item) => (item.id === r.id ? r : item)));
      }
    }

    const newReport: ReportItem = {
      id: `rep_${Date.now()}`,
      target_type: data.target_type,
      target_id: data.target_id,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      created_at: new Date().toISOString(),
      target_preview: preview,
      category,
    };

    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([newReport, ...reports]));
    }
    this.notifyListeners();
    return { success: true };
  }

  public resolveReport(reportId: string, action: 'dismiss' | 'hide_content' | 'penalize_and_hide'): void {
    const reports = this.getReports();
    const targetReport = reports.find((r) => r.id === reportId);
    if (!targetReport) return;

    if (action === 'hide_content' || action === 'penalize_and_hide') {
      if (targetReport.target_type === 'post') {
        const posts = this.getPosts().map((p) => {
          if (p.id === targetReport.target_id) {
            return { ...p, status: 'hidden_by_reports' as const };
          }
          return p;
        });
        this.savePosts(posts);
      } else {
        const replies = this.getAllReplies().map((r) => {
          if (r.id === targetReport.target_id) {
            return { ...r, status: 'hidden_by_reports' as const };
          }
          return r;
        });
        this.saveReplies(replies);
      }
    }

    const updated = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: (action === 'dismiss' ? 'dismissed' : 'resolved') as 'dismissed' | 'resolved',
          action_taken: action,
        };
      }
      return r;
    });

    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    }
    this.notifyListeners();
  }

  private listeners: Array<() => void> = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }
}

export const communityStore = new CommunityStore();
