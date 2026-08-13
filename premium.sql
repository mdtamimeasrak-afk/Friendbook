-- ======================================================
-- SOCIALHUB - PREMIUM FEATURES (REACTIONS + SAVED POSTS)
-- ======================================================
-- Run this whole file once in the Supabase SQL Editor.
-- Safe to run again (IF NOT EXISTS / drop-if-exists).
-- ======================================================


-- ======================================================
-- 1. LIKES TABLE - REACTION COLUMN
--    Facebook-style reaction (like / love / haha /
--    wow / sad / angry) stored on the existing likes
--    table. Defaults to 'like' so old rows work.
-- ======================================================

alter table public.likes
  add column if not exists reaction text default 'like';

-- Make sure RLS is active so the policies below apply.
alter table public.likes enable row level security;


-- ======================================================
-- 2. SAVED POSTS TABLE (BOOKMARKS)
-- ======================================================

create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.saved_posts enable row level security;

-- Nobody can update a saved row; users only
-- insert (save) or delete (unsave) their own.

drop policy if exists "saved_posts_select" on public.saved_posts;
create policy "saved_posts_select" on public.saved_posts
  for select using (auth.uid() = user_id);

drop policy if exists "saved_posts_insert" on public.saved_posts;
create policy "saved_posts_insert" on public.saved_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_posts_delete" on public.saved_posts;
create policy "saved_posts_delete" on public.saved_posts
  for delete using (auth.uid() = user_id);
