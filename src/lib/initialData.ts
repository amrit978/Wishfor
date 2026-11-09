import { Post, Reply, CurrentUser } from '@/types';

// Strict zero-mock policy: Zero fake/seed data in production.
// Real user transmissions only.
export const INITIAL_USERS: CurrentUser[] = [];
export const INITIAL_POSTS: Post[] = [];
export const INITIAL_REPLIES: Reply[] = [];
