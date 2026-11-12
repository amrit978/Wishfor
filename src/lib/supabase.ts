import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabaseServiceKey = typeof window === 'undefined'
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  : '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-url')
);

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('your-supabase-url')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Server-only privileged client bypassing RLS for verified Admin moderation actions.
 */
export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
