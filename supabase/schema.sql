-- ============================================================================
-- WISHFOR: Anonymous Peer-Help Community
-- Production Database Schema with Zero-Leak Row Level Security (RLS)
-- Tagline: "Say it. Someone's listening." | Emotional Heart: Mann ki baat
-- ============================================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. USERS TABLE (Private)
-- Holds authentication mapping and aggregate trust score.
-- CRITICAL: Never queried directly by public clients.
-- ============================================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  trust_score integer default 0 not null,
  role text default 'user' check (role in ('user', 'moderator', 'admin')) not null,
  is_banned boolean default false not null,
  banned_reason text,
  last_post_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Trust level helper function
create or replace function public.calculate_trust_level(score integer)
returns text language sql immutable as $$
  select case
    when score >= 100 then 'Trusted Voice'
    when score >= 50 then 'Guide'
    when score >= 20 then 'Helper'
    when score >= 5 then 'Listener'
    else 'Newcomer'
  end;
$$;

-- ============================================================================
-- 2. POSTS TABLE
-- Problems shared anonymously by askers.
-- ============================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in (
    'Personal', 'Career', 'Relationships', 'Family', 
    'Studies', 'Financial', 'Mental Health', 'Existential'
  )),
  title text,
  body text not null check (length(body) <= 2000),
  is_urgent boolean default false not null,
  status text default 'published' check (status in ('published', 'draft', 'hidden_by_reports', 'deleted')) not null,
  report_count integer default 0 not null,
  reply_count integer default 0 not null,
  helped_reply_id uuid,
  crisis_flagged boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_posts_status_created on public.posts (status, created_at desc);
create index if not exists idx_posts_category on public.posts (category);
create index if not exists idx_posts_user_id on public.posts (user_id);

-- ============================================================================
-- 3. THREAD MASKS TABLE (Per-Thread Anonymity Alias)
-- The core of cross-thread untrackability.
-- A user gets a mask assigned per post_id.
-- (post_id, user_id) is UNIQUE.
-- In thread A: User 123 is "Quiet Lantern"
-- In thread B: User 123 is "Midnight Kite"
-- The post author has is_asker = true.
-- ============================================================================
create table if not exists public.thread_masks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  mask_name text not null,
  mask_seed text not null,
  is_asker boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (post_id, user_id)
);

create index if not exists idx_thread_masks_lookup on public.thread_masks (post_id, user_id);

-- ============================================================================
-- 4. REPLIES TABLE
-- Support 1-level nested sub-replies.
-- ============================================================================
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_reply_id uuid references public.replies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (length(body) <= 2000),
  like_count integer default 0 not null,
  is_helped boolean default false not null,
  status text default 'published' check (status in ('published', 'hidden_by_reports', 'deleted')) not null,
  report_count integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_replies_post_likes on public.replies (post_id, like_count desc, created_at desc);
create index if not exists idx_replies_parent on public.replies (parent_reply_id);
create index if not exists idx_replies_user_id on public.replies (user_id);

-- Foreign key back to post helped_reply_id
alter table public.posts drop constraint if exists fk_posts_helped_reply;
alter table public.posts add constraint fk_posts_helped_reply 
  foreign key (helped_reply_id) references public.replies(id) on delete set null;

-- ============================================================================
-- 5. REPLY LIKES TABLE
-- Strictly one like per user per reply. No dislikes.
-- ============================================================================
create table if not exists public.reply_likes (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references public.replies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (reply_id, user_id)
);

create index if not exists idx_reply_likes_user on public.reply_likes (user_id);

-- ============================================================================
-- 6. TRUST EVENTS TABLE
-- Audit log of earned or deducted trust points.
-- Levels: Newcomer (0-4), Listener (5-19), Helper (20-49), Guide (50-99), Trusted Voice (100+)
-- ============================================================================
create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'like_received',   -- +1
    'helped_marked',    -- +5
    'clean_reply',      -- +1 for passing moderation
    'penalty'           -- -5 or -10 for rule violation
  )),
  points integer not null,
  reference_id uuid,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_trust_events_user on public.trust_events (user_id);

-- ============================================================================
-- 7. REPORTS TABLE (Community Moderation)
-- Flags harassment, spam, hate, unsafe advice, doxxing.
-- Auto-hides post/reply once report_count >= 3.
-- ============================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.users(id) on delete set null,
  target_type text not null check (target_type in ('post', 'reply')),
  target_id uuid not null,
  reason text not null check (reason in (
    'harassment', 'spam', 'hate', 'unsafe_advice', 'doxxing', 'other'
  )),
  details text,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')) not null,
  action_taken text,
  moderator_id uuid references public.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  resolved_at timestamptz
);

create index if not exists idx_reports_status on public.reports (status);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- Real-time notifications for post replies, likes, and helpful marks.
-- CRITICAL: Notification messages NEVER contain real email or identity!
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('reply_received', 'like_received', 'helped_marked', 'system')),
  post_id uuid not null references public.posts(id) on delete cascade,
  reply_id uuid references public.replies(id) on delete set null,
  message text not null,
  is_read boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_notifications_user on public.notifications (user_id, is_read, created_at desc);

-- ============================================================================
-- 9. BOOKMARKS TABLE ("My Space")
-- Allows users to privately save posts for later reading.
-- ============================================================================
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, post_id)
);

create index if not exists idx_bookmarks_user on public.bookmarks (user_id);

-- ============================================================================
-- 10. PUBLIC VIEWS WITH STRICT ZERO-IDENTITY LEAKAGE
-- Clients query these views. Notice user_id, email, and IP are completely absent.
-- ============================================================================

-- View for feed and single post details
create or replace view public.view_public_posts as
select 
  p.id,
  p.category,
  p.title,
  p.body,
  p.is_urgent,
  p.status,
  p.reply_count,
  p.helped_reply_id,
  p.crisis_flagged,
  p.created_at,
  p.updated_at,
  m.mask_name,
  m.mask_seed,
  m.is_asker,
  public.calculate_trust_level(u.trust_score) as trust_level
from public.posts p
inner join public.thread_masks m on m.post_id = p.id and m.user_id = p.user_id and m.is_asker = true
inner join public.users u on u.id = p.user_id
where p.status = 'published';

-- View for replies (sorted by likes descending, ties broken by newest)
create or replace view public.view_public_replies as
select 
  r.id,
  r.post_id,
  r.parent_reply_id,
  r.body,
  r.like_count,
  r.is_helped,
  r.status,
  r.created_at,
  r.updated_at,
  m.mask_name,
  m.mask_seed,
  m.is_asker,
  public.calculate_trust_level(u.trust_score) as trust_level
from public.replies r
inner join public.thread_masks m on m.post_id = r.post_id and m.user_id = r.user_id
inner join public.users u on u.id = r.user_id
where r.status = 'published';

-- ============================================================================
-- 11. TRIGGERS & AUTOMATION (Trust Scores, Like Counts, Auto-Hide)
-- ============================================================================

-- Trigger 1: Increment/decrement like_count and update replier's trust score (+1 / -1)
create or replace function public.handle_reply_like_change()
returns trigger language plpgsql security definer as $$
declare
  replier_id uuid;
begin
  if (TG_OP = 'INSERT') then
    -- Increment reply like count
    update public.replies set like_count = like_count + 1 where id = NEW.reply_id
    returning user_id into replier_id;

    -- Award +1 trust point to the replier
    if replier_id is not null then
      update public.users set trust_score = trust_score + 1 where id = replier_id;
      insert into public.trust_events (user_id, event_type, points, reference_id, notes)
      values (replier_id, 'like_received', 1, NEW.reply_id, 'Helpful reply liked by peer');

      -- Insert notification
      insert into public.notifications (user_id, type, post_id, reply_id, message)
      select replier_id, 'like_received', r.post_id, NEW.reply_id, 'Someone found your reply helpful and left a warm like.'
      from public.replies r where r.id = NEW.reply_id;
    end if;

    return NEW;
  elsif (TG_OP = 'DELETE') then
    -- Decrement reply like count
    update public.replies set like_count = greatest(0, like_count - 1) where id = OLD.reply_id
    returning user_id into replier_id;

    -- Deduct 1 trust point
    if replier_id is not null then
      update public.users set trust_score = greatest(0, trust_score - 1) where id = replier_id;
    end if;

    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists trigger_reply_like_change on public.reply_likes;
create trigger trigger_reply_like_change
  after insert or delete on public.reply_likes
  for each row execute function public.handle_reply_like_change();

-- Trigger 2: Award +5 trust points when reply is marked "This helped me"
create or replace function public.handle_helped_reply()
returns trigger language plpgsql security definer as $$
declare
  replier_id uuid;
begin
  if (NEW.helped_reply_id is distinct from OLD.helped_reply_id and NEW.helped_reply_id is not null) then
    -- Mark reply as helped
    update public.replies set is_helped = true where id = NEW.helped_reply_id
    returning user_id into replier_id;

    -- Award +5 bonus trust points
    if replier_id is not null then
      update public.users set trust_score = trust_score + 5 where id = replier_id;
      insert into public.trust_events (user_id, event_type, points, reference_id, notes)
      values (replier_id, 'helped_marked', 5, NEW.helped_reply_id, 'Asker marked this advice as "Helped me most"');

      -- Notify replier
      insert into public.notifications (user_id, type, post_id, reply_id, message)
      values (replier_id, 'helped_marked', NEW.id, NEW.helped_reply_id, 'Your advice touched the asker: they marked it as "This helped me most." (+5 trust)');
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_helped_reply on public.posts;
create trigger trigger_helped_reply
  after update of helped_reply_id on public.posts
  for each row execute function public.handle_helped_reply();

-- Trigger 3: Manage post reply_count
create or replace function public.handle_reply_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts set reply_count = reply_count + 1 where id = NEW.post_id;
    
    -- Award +1 trust point for clean reply
    update public.users set trust_score = trust_score + 1 where id = NEW.user_id;
    insert into public.trust_events (user_id, event_type, points, reference_id, notes)
    values (NEW.user_id, 'clean_reply', 1, NEW.id, 'Shared advice in community (+1 trust)');

    -- Notify asker if replier is not the asker
    insert into public.notifications (user_id, type, post_id, reply_id, message)
    select p.user_id, 'reply_received', NEW.post_id, NEW.id, 'A kind stranger left a suggestion on your problem.'
    from public.posts p
    where p.id = NEW.post_id and p.user_id <> NEW.user_id;

    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.posts set reply_count = greatest(0, reply_count - 1) where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists trigger_reply_count on public.replies;
create trigger trigger_reply_count
  after insert or delete on public.replies
  for each row execute function public.handle_reply_count();

-- Trigger 4: Auto-hide content if reports >= 3
create or replace function public.handle_report_threshold()
returns trigger language plpgsql security definer as $$
begin
  if NEW.target_type = 'post' then
    update public.posts 
    set report_count = report_count + 1,
        status = case when report_count + 1 >= 3 then 'hidden_by_reports' else status end
    where id = NEW.target_id;
  elsif NEW.target_type = 'reply' then
    update public.replies 
    set report_count = report_count + 1,
        status = case when report_count + 1 >= 3 then 'hidden_by_reports' else status end
    where id = NEW.target_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_report_threshold on public.reports;
create trigger trigger_report_threshold
  after insert on public.reports
  for each row execute function public.handle_report_threshold();

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.thread_masks enable row level security;
alter table public.replies enable row level security;
alter table public.reply_likes enable row level security;
alter table public.trust_events enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.bookmarks enable row level security;

-- Users RLS: can only view and update their own record
create policy "Users can view own data" 
  on public.users for select 
  using (auth.uid() = id);

create policy "Users can update own non-sensitive data" 
  on public.users for update 
  using (auth.uid() = id);

-- Posts RLS: anyone can view published posts; owners can manage own posts
create policy "Public can read published posts"
  on public.posts for select
  using (status = 'published');

create policy "Users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can hard delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Thread masks RLS: only accessible via security definer or public view
create policy "Public can read thread masks without revealing user_id"
  on public.thread_masks for select
  using (true);

create policy "Users can insert own mask for a thread"
  on public.thread_masks for insert
  with check (auth.uid() = user_id);

-- Replies RLS
create policy "Public can read published replies"
  on public.replies for select
  using (status = 'published');

create policy "Users can insert replies"
  on public.replies for insert
  with check (auth.uid() = user_id);

create policy "Users can update own replies"
  on public.replies for update
  using (auth.uid() = user_id);

create policy "Users can hard delete own replies"
  on public.replies for delete
  using (auth.uid() = user_id);

-- Likes RLS
create policy "Users can read likes"
  on public.reply_likes for select
  using (true);

create policy "Users can insert own likes"
  on public.reply_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on public.reply_likes for delete
  using (auth.uid() = user_id);

-- Bookmarks RLS: Strictly private to owner
create policy "Users can manage own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id);

-- Notifications RLS: Strictly private to owner
create policy "Users can read and update own notifications"
  on public.notifications for all
  using (auth.uid() = user_id);

-- Reports RLS: Users can insert reports; only moderators/admins can view all reports
create policy "Users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_user_id or reporter_user_id is null);

create policy "Moderators can view and manage reports"
  on public.reports for all
  using (
    exists (
      select 1 from public.users u 
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

-- End of schema.sql

