export type Category =
  | 'Personal'
  | 'Career'
  | 'Relationships'
  | 'Family'
  | 'Studies'
  | 'Financial'
  | 'Mental Health'
  | 'Existential';

export type TrustLevel =
  | 'Newcomer'
  | 'Listener'
  | 'Helper'
  | 'Guide'
  | 'Trusted Voice';

export type PostStatus = 'published' | 'draft' | 'hidden_by_reports' | 'deleted';

export interface Mask {
  name: string;
  seed: string;
  is_asker: boolean;
  trust_level: TrustLevel;
}

export interface Post {
  id: string;
  category: Category;
  title?: string;
  body: string;
  is_urgent: boolean;
  status: PostStatus;
  report_count: number;
  reply_count: number;
  helped_reply_id?: string | null;
  crisis_flagged?: boolean;
  created_at: string;
  updated_at: string;
  // Per-thread rotating anonymous cipher
  mask_name: string;
  mask_seed: string;
  is_asker: boolean;
  trust_level: TrustLevel;
  // Contextual flags
  is_saved?: boolean;
  is_author?: boolean;
  author_id?: string;
  author_email?: string;
  coordinates?: string;
}

export interface Reply {
  id: string;
  post_id: string;
  parent_reply_id?: string | null;
  body: string;
  like_count: number;
  is_helped: boolean;
  status: 'published' | 'hidden_by_reports' | 'deleted';
  report_count: number;
  created_at: string;
  updated_at: string;
  mask_name: string;
  mask_seed: string;
  is_asker: boolean;
  trust_level: TrustLevel;
  has_liked?: boolean;
  is_author?: boolean;
  author_id?: string;
  author_email?: string;
  sub_replies?: Reply[];
}

export type NotificationType =
  | 'reply_received'
  | 'like_received'
  | 'helped_marked'
  | 'system';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  post_id: string;
  reply_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'hate'
  | 'unsafe_advice'
  | 'doxxing'
  | 'other';

export interface ReportItem {
  id: string;
  reporter_user_id?: string;
  target_type: 'post' | 'reply';
  target_id: string;
  reason: ReportReason;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  action_taken?: string;
  created_at: string;
  target_preview?: string;
  category?: Category;
}

export interface CurrentUser {
  id: string;
  email?: string;
  phone?: string;
  is_authenticated?: boolean;
  trust_score: number;
  trust_level: TrustLevel;
  role: 'user' | 'moderator' | 'admin';
  is_banned: boolean;
  last_post_at?: string;
}
