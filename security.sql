-- ======================================================
-- SOCIALHUB - LAUNCH SECURITY SETUP (STEP 18)
-- ======================================================
-- Run this whole file once in the Supabase SQL Editor.
-- It is safe to run again (all statements use
-- IF NOT EXISTS / drop-if-exists).
-- ======================================================


-- ======================================================
-- 1. PROFILES - ROW LEVEL SECURITY
-- ======================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- No delete policy: nobody can delete a profile.


-- ======================================================
-- 2. POSTS - ROW LEVEL SECURITY
-- ======================================================

alter table public.posts enable row level security;

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts
  for select using (true);

drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "posts_update" on public.posts;
create policy "posts_update" on public.posts
  for update using (auth.uid() = user_id);

drop policy if exists "posts_delete" on public.posts;
create policy "posts_delete" on public.posts
  for delete using (auth.uid() = user_id);


-- ======================================================
-- 3. LIKES / COMMENTS / FRIENDSHIPS / NOTIFICATIONS
--    (re-created safely - already exist from earlier
--     steps, drop-if-exists keeps this file re-runnable)
-- ======================================================

drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes
  for select using (true);

drop policy if exists "likes_insert" on public.likes;
create policy "likes_insert" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete" on public.likes
  for delete using (auth.uid() = user_id);


drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select using (true);

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments
  for delete using (auth.uid() = user_id);


drop policy if exists "friendships_select" on public.friendships;
create policy "friendships_select" on public.friendships
  for select using (true);

drop policy if exists "friendships_insert" on public.friendships;
create policy "friendships_insert" on public.friendships
  for insert with check (auth.uid() = requester_id);

drop policy if exists "friendships_update" on public.friendships;
create policy "friendships_update" on public.friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friendships_delete" on public.friendships;
create policy "friendships_delete" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);


drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert with check (auth.uid() = actor_id);

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using (auth.uid() = user_id);

drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications
  for delete using (auth.uid() = user_id);


-- ======================================================
-- 4. AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
--    The official Supabase pattern: when a new auth
--    user is created, a profile row is created
--    automatically. Combined with the upsert in
--    script.js, signup never fails.
-- ======================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Triggers do not need public execute permission
revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
