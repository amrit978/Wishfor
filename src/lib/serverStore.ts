import { Post, Reply, Category, TrustLevel } from '@/types';
import { getMaskForThread } from './anonymity';
import { validateProblemContent, validateReplyContent } from './serverModeration';
import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_POSTS } from './initialData';

// In-memory server-side cache for persistence across API requests
const serverPosts: Post[] = [];
const serverReplies: Reply[] = [];

// Rate limiting: Map<ipOrUserKey, lastActionTimestamp>
const postCooldowns = new Map<string, number>();
const replyCooldowns = new Map<string, number>();

const POST_COOLDOWN_MS = 15 * 1000; // 15 seconds cooldown between posts
const REPLY_COOLDOWN_MS = 5 * 1000;  // 5 seconds cooldown between replies

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

  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
  // If Supabase is configured, pull newest posts from Supabase table
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const dbIds = new Set(data.map((p: any) => p.id));
        const memoryPosts = serverPosts.filter((p) => !dbIds.has(p.id) && p.status === 'published');
        let combined = [...memoryPosts, ...data];
        if (filters?.unanswered) {
          combined = combined.filter((p) => (p.reply_count || 0) === 0);
        }
        return combined;
      }
    } catch (e: any) {
      console.warn('[Supabase Posts Fetch Error]:', e.message);
    }
  }

  // Fallback: in-memory server posts initialized with baseline
  if (serverPosts.length === 0) {
    serverPosts.push(...INITIAL_POSTS);
  }

  let list = serverPosts.filter((p) => p.status === 'published');

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

  // Prevent author from submitting top-level suggestions to their own question
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

  const replyId = `reply_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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

  // Increment reply count on the post
  const targetPost = serverPosts.find((p) => p.id === data.postId);
  if (targetPost) {
    targetPost.reply_count += 1;
    targetPost.updated_at = new Date().toISOString();
  }

  // Supabase sync if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('replies').insert([newReply]);
      if (targetPost) {
        await supabase
          .from('posts')
          .update({ reply_count: targetPost.reply_count, updated_at: targetPost.updated_at })
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
  // If Supabase is configured, pull newest replies from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'published');
      if (!error && data && data.length > 0) {
        const dbIds = new Set(data.map((r: any) => r.id));
        const memoryReplies = serverReplies.filter(
          (r) => r.post_id === postId && !dbIds.has(r.id) && r.status === 'published'
        );
        const combined = [...memoryReplies, ...data];
        combined.sort((a, b) => {
          if (a.is_helped && !b.is_helped) return -1;
          if (!a.is_helped && b.is_helped) return 1;
          if (b.like_count !== a.like_count) return b.like_count - a.like_count;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return combined;
      }
    } catch (e: any) {
      console.warn('[Supabase Replies Fetch Error]:', e.message);
    }
  }

  let list = serverReplies.filter((r) => r.post_id === postId && r.status === 'published');

  // Sort by helped status first, then likes descending
  list.sort((a, b) => {
    if (a.is_helped && !b.is_helped) return -1;
    if (!a.is_helped && b.is_helped) return 1;
    if (b.like_count !== a.like_count) {
      return b.like_count - a.like_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return list;
}

