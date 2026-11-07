-- ============================================================================
-- WISHFOR: Authentic Seed Data (English Sanctuary Transmissions)
-- Demonstrates per-thread rotating cipher masks and trust level badges.
-- ============================================================================

-- Create 6 anonymous user profiles (internal users, identities hidden)
insert into public.users (id, email, trust_score, role) values
  ('11111111-1111-4111-8111-111111111111', 'anon_user1@wishfor.internal', 35, 'user'),      -- Helper badge
  ('22222222-2222-4222-8222-222222222222', 'anon_user2@wishfor.internal', 78, 'user'),      -- Guide badge
  ('33333333-3333-4333-8333-333333333333', 'anon_user3@wishfor.internal', 115, 'user'),     -- Trusted Voice badge
  ('44444444-4444-4444-8444-444444444444', 'anon_user4@wishfor.internal', 12, 'user'),      -- Listener badge
  ('55555555-5555-4555-8555-555555555555', 'anon_user5@wishfor.internal', 4, 'user'),       -- Newcomer badge
  ('66666666-6666-4666-8666-666666666666', 'guardian@wishfor.internal', 150, 'moderator')   -- Trusted Voice / Mod
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- POST 1: Career / Deception Burden
-- ----------------------------------------------------------------------------
insert into public.posts (id, user_id, category, title, body, is_urgent, status, reply_count, created_at, updated_at)
values (
  'a1111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'Career',
  'Laid off three weeks ago. Every morning I put on my suit and leave home so my parents don''t panic.',
  'I have been the sole financial anchor for our household for four years. The company conducted a sudden mass restructuring, and on Friday afternoon my access was revoked without warning. My father has a heart condition; he takes immense quiet pride in believing his son is an engineering director at a global firm. Every morning at 8:15 AM, I put on my formal shirt, kiss my mother''s forehead, and leave. I spend twelve hours sitting in public libraries and train stations sending out resumes. At 7:00 PM, I walk back through the front door with a practiced smile.

My emergency savings will evaporate in eight weeks. The deception is exhausting every ounce of mental stamina I have left. If anyone here has walked through this trial, how did you break the truth to those who believe in you without breaking their spirit?',
  true,
  'published',
  3,
  now() - interval '5 hours',
  now() - interval '5 hours'
);

-- Masks for Post 1
insert into public.thread_masks (post_id, user_id, mask_name, mask_seed, is_asker) values
  ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Quiet Lantern', '0-101', true),
  ('a1111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Silver Moth', '1-201', false),
  ('a1111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'Desert Pine', '0-301', false);

-- Replies for Post 1
insert into public.replies (id, post_id, parent_reply_id, user_id, body, like_count, is_helped, status, created_at, updated_at) values
(
  'r1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111',
  null,
  '33333333-3333-4333-8333-333333333333',
  'Listen to me carefully: Take one slow, deliberate breath. You are not a failure; corporations make cold, mathematical balance-sheet reductions that bear zero correlation with your integrity as a son or an engineer.

I maintained this exact same facade for 42 days in late 2020. One afternoon, sitting in an empty public conservatory, I broke down completely. When I finally sat my father down, his immediate words were: "Are you well? Jobs are replaceable; your spirit is not."

Here is tactical advice:
1. Do not deliver this in a tense confrontation. Choose a quiet morning over hot coffee.
2. Present the reality paired with a framework: "The firm eliminated our entire division. I have two months of transition capital and four active pipelines in progress."
3. Sustaining a daily lie consumes vastly more neural energy than navigating the job market itself. Conserve your strength for interviews. You will cross this river.',
  26,
  true,
  'published',
  now() - interval '4 hours',
  now() - interval '4 hours'
),
(
  'r1111111-2222-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111',
  null,
  '22222222-2222-4222-8222-222222222222',
  'Stop spending personal capital on commercial coffee houses. Seek out public municipal libraries or civic co-working hubs with quiet desks and reliable power. If you need an objective technical resume review without any trace of your real name or employer, post your core architecture competencies here. Several of us actively review candidates in industry.',
  14,
  false,
  'published',
  now() - interval '3 hours',
  now() - interval '3 hours'
);

-- Sub-reply from Asker to Desert Pine
insert into public.replies (id, post_id, parent_reply_id, user_id, body, like_count, is_helped, status, created_at, updated_at) values
(
  'r1111111-3333-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111',
  'r1111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'Thank you, Desert Pine. You cannot fathom the clarity that "sustaining a daily lie consumes vastly more neural energy than navigating the job market" just gave me. I will speak to my father tomorrow morning.',
  9,
  false,
  'published',
  now() - interval '2 hours',
  now() - interval '2 hours'
);

update public.posts set helped_reply_id = 'r1111111-1111-4111-8111-111111111111' where id = 'a1111111-1111-4111-8111-111111111111';

-- ----------------------------------------------------------------------------
-- POST 2: Relationships
-- ----------------------------------------------------------------------------
insert into public.posts (id, user_id, category, title, body, is_urgent, status, reply_count, created_at, updated_at)
values (
  'a2222222-2222-4222-8222-222222222222',
  '44444444-4444-4444-8444-444444444444',
  'Relationships',
  'We have been together for five years. We don''t fight, but we live like two polite ghosts sharing an apartment.',
  'There are no explosive arguments. We divide chores with clinical precision. We ask each other what groceries to order. But the tenderness has evaporated completely. We haven''t touched each other while sleeping in months, and we no longer share our fears or secret dreams.

Is this simply the inevitable settling of long-term intimacy, or have we quietly uncoupled without having the courage to admit it? How do you rekindle vulnerability when everyday routine has turned everything to stone?',
  false,
  'published',
  1,
  now() - interval '11 hours',
  now() - interval '11 hours'
);

insert into public.thread_masks (post_id, user_id, mask_name, mask_seed, is_asker) values
  ('a2222222-2222-4222-8222-222222222222', '44444444-4444-4444-8444-444444444444', 'Midnight Kite', '4-402', true),
  ('a2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'River Stone', '2-202', false);

insert into public.replies (id, post_id, parent_reply_id, user_id, body, like_count, is_helped, status, created_at, updated_at) values
(
  'r2222222-1111-4222-8222-222222222222',
  'a2222222-2222-4222-8222-222222222222',
  null,
  '22222222-2222-4222-8222-222222222222',
  'Routine is not death; it is simply the natural resting state of biological organisms after passion settles. What is toxic is the withdrawal of vulnerability.

Try this concrete protocol tonight: Keep all screens in a different room. Dim the lamps. Ask one genuinely dangerous, honest question: "What is something about yourself or about us that you have been holding back out of fear of disrupting our peace?" When emotional risk returns, intimacy follows right behind it.',
  31,
  true,
  'published',
  now() - interval '9 hours',
  now() - interval '9 hours'
);

update public.posts set helped_reply_id = 'r2222222-1111-4222-8222-222222222222' where id = 'a2222222-2222-4222-8222-222222222222';

-- ----------------------------------------------------------------------------
-- POST 10: Mental Health / Crisis Demonstrated
-- ----------------------------------------------------------------------------
insert into public.posts (id, user_id, category, title, body, is_urgent, status, reply_count, crisis_flagged, created_at, updated_at)
values (
  'a0000000-0000-4000-8000-000000000000',
  '33333333-3333-4333-8333-333333333333',
  'Mental Health',
  'I don''t want to harm anyone. I just need this unrelenting buzzing static in my skull to finally go quiet.',
  'I have been fighting an overwhelming fog for eight straight months. I have exhausted standard remedies: rigorous exercise, mindfulness, clinical consultations that stretched past my insurance allowance. Every morning, pulling myself out of bed feels like lifting iron out of wet cement.

I am so tired of performing stability. If I dissolved tonight, I wonder if the world would even notice the shift in air pressure.',
  true,
  'published',
  1,
  true,
  now() - interval '2 hours',
  now() - interval '2 hours'
);

insert into public.thread_masks (post_id, user_id, mask_name, mask_seed, is_asker) values
  ('a0000000-0000-4000-8000-000000000000', '33333333-3333-4333-8333-333333333333', 'Dusk Willow', '1-010', true),
  ('a0000000-0000-4000-8000-000000000000', '66666666-6666-4666-8666-666666666666', 'Gentle Guardian', '0-610', false);

insert into public.replies (id, post_id, parent_reply_id, user_id, body, like_count, is_helped, status, created_at, updated_at) values
(
  'r0000000-1111-4000-8000-000000000000',
  'a0000000-0000-4000-8000-000000000000',
  null,
  '66666666-6666-4666-8666-666666666666',
  'We hear you across the wire. Your presence in this room matters profoundly, and your weariness is acknowledged without any condition.

Please hear me clearly right now: Do not attempt to carry this boulder through the dark alone. Reach out immediately to the crisis line at 988 (US/Canada) or 112 / 14416 (Tele-MANAS) or text HOME to 741741. There is a trained human waiting to steady you without judgment.

Hold on. The morning arrives, and this heavy static does break.',
  38,
  true,
  'published',
  now() - interval '1 hour',
  now() - interval '1 hour'
);

update public.posts set helped_reply_id = 'r0000000-1111-4000-8000-000000000000' where id = 'a0000000-0000-4000-8000-000000000000';
