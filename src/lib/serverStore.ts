import { Post, Reply, Category } from '@/types';
import { getMaskForThread } from './anonymity';
import { validateProblemContent, validateReplyContent } from './serverModeration';
import {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  isSupabaseAdminConfigured,
} from './supabase';
import { INITIAL_POSTS } from './initialData';

// In-memory server-side cache for persistence across API requests
const serverPosts: Post[] = [];
const serverReplies: Reply[] = [];
const deletedPostIds = new Set<string>();
const deletedReplyIds = new Set<string>();

// Rate limiting: Map<ipOrUserKey, lastActionTimestamp>
const postCooldowns = new Map<string, number>();
const replyCooldowns = new Map<string, number>();

const POST_COOLDOWN_MS = 15 * 1000; // 15 seconds cooldown between posts
const REPLY_COOLDOWN_MS = 5 * 1000; // 5 seconds cooldown between replies

/**
 * Sanitizes input text to neutralize HTML injection and script tags
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validates and rate-limits post creation on the server
 */
export async function createServerPost(data: {
  id?: string;
  title?: string;
  body: string;
  category: Category;
  is_urgent?: boolean;
  is_draft?: boolean;
  clientIp?: string;
}): Promise<{ success: boolean; post?: Post; error?: string; waitSeconds?: number; isCrisis?: boolean }> {
  const ipKey = data.clientIp || 'client_unknown';
  const now = Date.now();

  // Rate limit check
  const lastPostTime = postCooldowns.get(ipKey);
  if (lastPostTime && now - lastPostTime < POST_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((POST_COOLDOWN_MS - (now - lastPostTime)) / 1000);
    return {
      success: false,
      error: `Please pause ${waitSeconds}s between posts.`,
      waitSeconds,
    };
  }

  const cleanTitle = data.title ? sanitizeText(data.title) : undefined;
  const cleanBody = sanitizeText(data.body);

  const validation = validateProblemContent(cleanTitle, cleanBody);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const hasValidClientId = Boolean(data.id && /^post_[a-zA-Z0-9_-]{4,64}$/.test(data.id));
  const postId = hasValidClientId
    ? data.id!
    : `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const pseudoUser = `user_${Math.random().toString(36).substring(2, 8)}`;
  const threadMask = getMaskForThread(pseudoUser, postId, true);

  const newPost: Post = {
    id: postId,
    category: data.category || 'Personal',
    title: cleanTitle || undefined,
    body: cleanBody,
    is_urgent: Boolean(data.is_urgent),
    status: data.is_draft ? 'draft' : 'published',
    report_count: 0,
    reply_count: 0,
    helped_reply_id: null,
    crisis_flagged: validation.isCrisis,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    mask_name: threadMask.mask_name,
    mask_seed: threadMask.mask_seed,
    is_asker: true,
    trust_level: 'Newcomer',
  };

  serverPosts.unshift(newPost);
  postCooldowns.set(ipKey, now);

  // Supabase sync if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('posts').insert([newPost]);
    } catch (e: any) {
      console.warn('[Supabase Sync Warning]:', e.message);
    }
  }

  return { success: true, post: newPost, isCrisis: validation.isCrisis };
}

/**
 * Returns public posts without exposing any private identifiers
 */
export async function getServerPosts(filters?: {
  category?: string;
  unanswered?: boolean;
}): Promise<Post[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const dbIds = new Set(data.map((p: any) => p.id));
        const memoryPosts = serverPosts.filter(
          (p) => !dbIds.has(p.id) && p.status === 'published' && !deletedPostIds.has(p.id)
        );
        let combined = [...memoryPosts, ...data].filter((p) => !deletedPostIds.has(p.id));
        if (filters?.unanswered) {
          combined = combined.filter((p) => (p.reply_count || 0) === 0);
        }
        return combined;
      }
    } catch (e: any) {
      console.warn('[Supabase Posts Fetch Error]:', e.message);
    }
  }

  // Fallback: in-memory server posts
  if (serverPosts.length === 0 && deletedPostIds.size === 0 && process.env.NEXT_PUBLIC_DEV_SEED === 'true') {
    serverPosts.push(...INITIAL_POSTS);
  }

  let list = serverPosts.filter((p) => p.status === 'published' && !deletedPostIds.has(p.id));

  if (filters?.category && filters.category !== 'All') {
    list = list.filter((p) => p.category === filters.category);
  }

  if (filters?.unanswered) {
    list = list.filter((p) => p.reply_count === 0);
  }

  return list;
}

/**
 * Validates and stores a reply on the server
 */
export async function createServerReply(data: {
  id?: string;
  postId: string;
  body: string;
  parentReplyId?: string | null;
  isAsker?: boolean;
  clientIp?: string;
}): Promise<{ success: boolean; reply?: Reply; error?: string; waitSeconds?: number }> {
  const ipKey = data.clientIp || 'client_unknown';
  const now = Date.now();

  const lastReplyTime = replyCooldowns.get(ipKey);
  if (lastReplyTime && now - lastReplyTime < REPLY_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((REPLY_COOLDOWN_MS - (now - lastReplyTime)) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSeconds}s between replies.`,
      waitSeconds,
    };
  }

  if (data.isAsker && !data.parentReplyId) {
    return {
      success: false,
      error: 'Authors cannot submit suggestions to their own problem.',
    };
  }

  const cleanBody = sanitizeText(data.body);
  const validation = validateReplyContent(cleanBody);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const hasValidClientId = Boolean(data.id && /^reply_[a-zA-Z0-9_-]{4,64}$/.test(data.id));
  const replyId = hasValidClientId
    ? data.id!
    : `reply_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const pseudoUser = `user_${Math.random().toString(36).substring(2, 8)}`;
  const threadMask = getMaskForThread(pseudoUser, data.postId, Boolean(data.isAsker));

  const newReply: Reply = {
    id: replyId,
    post_id: data.postId,
    parent_reply_id: data.parentReplyId || null,
    body: cleanBody,
    like_count: 0,
    is_helped: false,
    status: 'published',
    report_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    mask_name: threadMask.mask_name,
    mask_seed: threadMask.mask_seed,
    is_asker: Boolean(data.isAsker),
    trust_level: 'Listener',
  };

  serverReplies.push(newReply);
  replyCooldowns.set(ipKey, now);

  const targetPost = serverPosts.find((p) => p.id === data.postId);
  if (targetPost) {
    targetPost.reply_count += 1;
    targetPost.updated_at = new Date().toISOString();
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('replies').insert([newReply]);
      const dbCount = targetPost?.reply_count;
      if (typeof dbCount === 'number') {
        await supabase
          .from('posts')
          .update({ reply_count: dbCount, updated_at: new Date().toISOString() })
          .eq('id', data.postId);
      }
    } catch (e: any) {
      console.warn('[Supabase Reply Sync Warning]:', e.message);
    }
  }

  return { success: true, reply: newReply };
}

/**
 * Retrieves public replies for a post, sorted by helpful status and likes
 */
export async function getServerReplies(postId: string): Promise<Reply[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'published');
      if (!error && Array.isArray(data)) {
        const dbIds = new Set(data.map((r: any) => r.id));
        const memoryReplies = serverReplies.filter(
          (r) =>
            r.post_id === postId &&
            !dbIds.has(r.id) &&
            r.status === 'published' &&
            !deletedReplyIds.has(r.id)
        );
        const combined = [...memoryReplies, ...data].filter((r) => !deletedReplyIds.has(r.id));
        sortReplies(combined);
        return combined;
      }
    } catch (e: any) {
      console.warn('[Supabase Replies Fetch Error]:', e.message);
    }
  }

  const list = serverReplies.filter(
    (r) => r.post_id === postId && r.status === 'published' && !deletedReplyIds.has(r.id)
  );
  sortReplies(list);
  return list;
}

function sortReplies(list: Reply[]): void {
  list.sort((a, b) => {
    if (a.is_helped && !b.is_helped) return -1;
    if (!a.is_helped && b.is_helped) return 1;
    if (b.like_count !== a.like_count) return b.like_count - a.like_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Removes a post and its replies across Supabase & memory stores (Admin action).
 */
export async function deleteServerPost(postId: string): Promise<{
  success: boolean;
  deletedFromDb: boolean;
  requiresServiceRole?: boolean;
  error?: string;
}> {
  if (!postId) {
    return { success: false, deletedFromDb: false, error: 'postId is required.' };
  }

  // Clean in-memory stores first
  for (let i = serverPosts.length - 1; i >= 0; i--) {
    if (serverPosts[i].id === postId) serverPosts.splice(i, 1);
  }
  for (let i = serverReplies.length - 1; i >= 0; i--) {
    if (serverReplies[i].post_id === postId) {
      deletedReplyIds.add(serverReplies[i].id);
      serverReplies.splice(i, 1);
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    deletedPostIds.add(postId);
    return { success: true, deletedFromDb: false };
  }

  const dbClient = supabaseAdmin || supabase;

  try {
    await dbClient.from('replies').delete().eq('post_id', postId);
    const { error: delError } = await dbClient.from('posts').delete().eq('id', postId);

    if (isSupabaseAdminConfigured && !delError) {
      deletedPostIds.add(postId);
      return { success: true, deletedFromDb: true };
    }

    // Without service role key, verify if Supabase RLS blocked deletion
    const { data: remaining } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (remaining) {
      return {
        success: false,
        deletedFromDb: false,
        requiresServiceRole: !isSupabaseAdminConfigured,
        error: isSupabaseAdminConfigured
          ? delError?.message || 'Could not remove post from Supabase.'
          : 'Supabase Row-Level Security blocked deletion. Add SUPABASE_SERVICE_ROLE_KEY to Vercel / .env.local to arm Admin deletions.',
      };
    }

    deletedPostIds.add(postId);
    return { success: true, deletedFromDb: true };
  } catch (err: any) {
    return {
      success: false,
      deletedFromDb: false,
      requiresServiceRole: !isSupabaseAdminConfigured,
      error: err.message || 'Database error deleting post.',
    };
  }
}

/**
 * Removes a single reply from Supabase & memory stores (Admin action).
 */
export async function deleteServerReply(replyId: string): Promise<{
  success: boolean;
  deletedFromDb: boolean;
  requiresServiceRole?: boolean;
  error?: string;
}> {
  if (!replyId) {
    return { success: false, deletedFromDb: false, error: 'replyId is required.' };
  }

  let parentPostId: string | null = null;
  for (let i = serverReplies.length - 1; i >= 0; i--) {
    if (serverReplies[i].id === replyId) {
      parentPostId = serverReplies[i].post_id;
      serverReplies.splice(i, 1);
    }
  }

  if (parentPostId) {
    const parent = serverPosts.find((p) => p.id === parentPostId);
    if (parent) {
      parent.reply_count = Math.max(0, parent.reply_count - 1);
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    deletedReplyIds.add(replyId);
    return { success: true, deletedFromDb: false };
  }

  const dbClient = supabaseAdmin || supabase;

  try {
    const { data: replyRow } = await dbClient
      .from('replies')
      .select('post_id')
      .eq('id', replyId)
      .maybeSingle();

    await dbClient.from('replies').delete().eq('parent_reply_id', replyId);
    const { error: delError } = await dbClient.from('replies').delete().eq('id', replyId);

    const { data: remaining } = await supabase
      .from('replies')
      .select('id')
      .eq('id', replyId)
      .maybeSingle();

    if (remaining) {
      return {
        success: false,
        deletedFromDb: false,
        requiresServiceRole: !isSupabaseAdminConfigured,
        error: isSupabaseAdminConfigured
          ? delError?.message || 'Could not remove reply from Supabase.'
          : 'Supabase Row-Level Security blocked reply deletion. Add SUPABASE_SERVICE_ROLE_KEY to Vercel / .env.local.',
      };
    }

    deletedReplyIds.add(replyId);

    // Sync parent post reply_count if needed
    const pid = replyRow?.post_id || parentPostId;
    if (pid && isSupabaseAdminConfigured && supabaseAdmin) {
      const { count } = await supabaseAdmin
        .from('replies')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', pid)
        .eq('status', 'published');
      if (typeof count === 'number') {
        await supabaseAdmin
          .from('posts')
          .update({ reply_count: count, updated_at: new Date().toISOString() })
          .eq('id', pid);
      }
    }

    return { success: true, deletedFromDb: true };
  } catch (err: any) {
    return {
      success: false,
      deletedFromDb: false,
      requiresServiceRole: !isSupabaseAdminConfigured,
      error: err.message || 'Database error deleting reply.',
    };
  }
}

/**
 * Returns full Admin dataset (all posts + replies + system readiness flags).
 */
export async function getAdminServerOverview(): Promise<{
  posts: Post[];
  replies: Reply[];
  isSupabaseConfigured: boolean;
  isSupabaseAdminConfigured: boolean;
}> {
  let posts: Post[] = [];
  let replies: Reply[] = [];

  const dbClient = supabaseAdmin || supabase;

  if (isSupabaseConfigured && dbClient) {
    try {
      const [{ data: dbPosts, error: pErr }, { data: dbReplies, error: rErr }] = await Promise.all([
        dbClient.from('posts').select('*').order('created_at', { ascending: false }),
        dbClient.from('replies').select('*').order('created_at', { ascending: false }),
      ]);

      if (!pErr && Array.isArray(dbPosts)) {
        const dbIds = new Set(dbPosts.map((p: any) => p.id));
        const memOnly = serverPosts.filter((p) => !dbIds.has(p.id) && !deletedPostIds.has(p.id));
        posts = [...memOnly, ...dbPosts].filter((p) => !deletedPostIds.has(p.id));
      }
      if (!rErr && Array.isArray(dbReplies)) {
        const dbRIds = new Set(dbReplies.map((r: any) => r.id));
        const memOnlyR = serverReplies.filter((r) => !dbRIds.has(r.id) && !deletedReplyIds.has(r.id));
        replies = [...memOnlyR, ...dbReplies].filter((r) => !deletedReplyIds.has(r.id));
      }
    } catch (e: any) {
      console.warn('[Admin Overview Fetch Warning]:', e.message);
    }
  } else {
    posts = serverPosts.filter((p) => !deletedPostIds.has(p.id));
    replies = serverReplies.filter((r) => !deletedReplyIds.has(r.id));
  }

  return {
    posts,
    replies,
    isSupabaseConfigured,
    isSupabaseAdminConfigured,
  };
}
