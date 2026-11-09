-- ============================================================================
-- WISHFOR: Quickstart Supabase Setup
-- Run this script in the Supabase SQL Editor (>_ icon on the left sidebar).
-- ============================================================================

-- 1. POSTS TABLE
create table if not exists public.posts (
  id text primary key,
  category text not null,
  title text,
  body text not null,
  is_urgent boolean default false not null,
  status text default 'published' not null,
  report_count integer default 0 not null,
  reply_count integer default 0 not null,
  helped_reply_id text,
  crisis_flagged boolean default false not null,
  mask_name text not null,
  mask_seed text not null,
  is_asker boolean default true not null,
  trust_level text default 'Newcomer' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_posts_category on public.posts (category);
create index if not exists idx_posts_created_at on public.posts (created_at desc);

-- 2. REPLIES TABLE
create table if not exists public.replies (
  id text primary key,
  post_id text not null references public.posts(id) on delete cascade,
  parent_reply_id text,
  body text not null,
  like_count integer default 0 not null,
  is_helped boolean default false not null,
  status text default 'published' not null,
  report_count integer default 0 not null,
  mask_name text not null,
  mask_seed text not null,
  is_asker boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_replies_post_id on public.replies (post_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.posts enable row level security;
alter table public.replies enable row level security;

-- Posts Policies
drop policy if exists "Allow public select published posts" on public.posts;
create policy "Allow public select published posts"
  on public.posts for select
  using (status = 'published');

drop policy if exists "Allow public insert posts" on public.posts;
create policy "Allow public insert posts"
  on public.posts for insert
  with check (true);

drop policy if exists "Allow public update posts" on public.posts;
create policy "Allow public update posts"
  on public.posts for update
  using (true);

-- Replies Policies
drop policy if exists "Allow public select replies" on public.replies;
create policy "Allow public select replies"
  on public.replies for select
  using (status = 'published');

drop policy if exists "Allow public insert replies" on public.replies;
create policy "Allow public insert replies"
  on public.replies for insert
  with check (true);

drop policy if exists "Allow public update replies" on public.replies;
create policy "Allow public update replies"
  on public.replies for update
  using (true);

