-- ======================================================
-- SOCIALHUB - COMPLETE SUPABASE SETUP (RUN ONCE)
-- ======================================================
-- Everything in one file: tables, storage buckets,
-- RLS security, signup trigger, reactions, saved posts.
-- SAFE TO RE-RUN (all statements are IF NOT EXISTS /
-- drop-if-exists based).
-- Run the whole file in the Supabase SQL Editor.
-- ======================================================


-- ======================================================
-- 1. TABLES (only created if missing)
-- ======================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text,
  bio text,
  avatar_url text,
  location text,
  work text,
  education text,
  website text,
  birthday text,
  created_at timestamptz not null default now()
);

-- Old schemas may have username as NOT NULL, which breaks the
-- auto-create-profile trigger on signup (fixes HTTP 500 signup).
alter table public.profiles
  alter column username drop not null;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  image_url text,
  background text,
  video_url text,
  audience text not null default 'public',
  created_at timestamptz not null default now()
);

-- Older databases may lack the audience column
alter table public.posts
  add column if not exists audience text not null default 'public';

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  parent_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Older databases may lack the reply column
alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

create table if not exists public.post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  thought text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  type text not null default 'general',
  post_id uuid references public.posts (id) on delete cascade,
  content text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);


-- ======================================================
-- 2. REACTIONS (Facebook-style)
--    Adds the reaction column to the likes table.
-- ======================================================

alter table public.likes
  add column if not exists reaction text default 'like';


-- ======================================================
-- 3. SAVED POSTS (BOOKMARKS)
-- ======================================================

create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);


-- ======================================================
-- 4. STORAGE BUCKETS + POLICIES (avatars, post-images)
-- ======================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true),
       ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read" on storage.objects
  for select using (bucket_id = 'post-images');

drop policy if exists "post_images_insert" on storage.objects;
create policy "post_images_insert" on storage.objects
  for insert with check (bucket_id = 'post-images' and auth.uid() = owner);

drop policy if exists "post_images_update" on storage.objects;
create policy "post_images_update" on storage.objects
  for update using (bucket_id = 'post-images' and auth.uid() = owner);

drop policy if exists "post_images_delete" on storage.objects;
create policy "post_images_delete" on storage.objects
  for delete using (bucket_id = 'post-images' and auth.uid() = owner);


-- ======================================================
-- 5. ROW LEVEL SECURITY
-- ======================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.friendships enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_posts enable row level security;

-- PROFILES

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- POSTS

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

-- LIKES

drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes
  for select using (true);

drop policy if exists "likes_insert" on public.likes;
create policy "likes_insert" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete" on public.likes
  for delete using (auth.uid() = user_id);

-- COMMENTS

drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select using (true);

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments
  for delete using (auth.uid() = user_id);

-- POST SHARES

drop policy if exists "post_shares_select" on public.post_shares;
create policy "post_shares_select" on public.post_shares
  for select using (true);

drop policy if exists "post_shares_insert" on public.post_shares;
create policy "post_shares_insert" on public.post_shares
  for insert with check (auth.uid() = user_id);

drop policy if exists "post_shares_delete" on public.post_shares;
create policy "post_shares_delete" on public.post_shares
  for delete using (auth.uid() = user_id);

-- FRIENDSHIPS

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

-- NOTIFICATIONS

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

-- SAVED POSTS

drop policy if exists "saved_posts_select" on public.saved_posts;
create policy "saved_posts_select" on public.saved_posts
  for select using (auth.uid() = user_id);

drop policy if exists "saved_posts_insert" on public.saved_posts;
create policy "saved_posts_insert" on public.saved_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_posts_delete" on public.saved_posts;
create policy "saved_posts_delete" on public.saved_posts
  for delete using (auth.uid() = user_id);


-- ======================================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
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

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ======================================================
-- 7. MESSAGES (private chat)
-- ======================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (auth.uid() = sender_id);

drop policy if exists "messages_update" on public.messages;
create policy "messages_update" on public.messages
  for update using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages
  for delete using (auth.uid() = sender_id);

-- Enable real-time for instant message delivery
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;


-- ======================================================
-- 8. VIDEO POSTS + STORIES
-- ======================================================

-- Video posts: posts table gets a video_url column
alter table public.posts
  add column if not exists video_url text;

-- Stories table (24h expiry)
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  media_url text not null,
  media_type text not null default 'image',
  caption text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.stories enable row level security;

drop policy if exists "stories_select" on public.stories;
create policy "stories_select" on public.stories
  for select using (true);

drop policy if exists "stories_insert" on public.stories;
create policy "stories_insert" on public.stories
  for insert with check (auth.uid() = user_id);

drop policy if exists "stories_delete" on public.stories;
create policy "stories_delete" on public.stories
  for delete using (auth.uid() = user_id);

-- Storage buckets: videos (post videos) + stories (story media)
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true),
       ('stories', 'stories', true)
on conflict (id) do nothing;

drop policy if exists "videos_public_read" on storage.objects;
create policy "videos_public_read" on storage.objects
  for select using (bucket_id = 'videos');

drop policy if exists "videos_insert" on storage.objects;
create policy "videos_insert" on storage.objects
  for insert with check (bucket_id = 'videos' and auth.uid() = owner);

drop policy if exists "videos_update" on storage.objects;
create policy "videos_update" on storage.objects
  for update using (bucket_id = 'videos' and auth.uid() = owner);

drop policy if exists "videos_delete" on storage.objects;
create policy "videos_delete" on storage.objects
  for delete using (bucket_id = 'videos' and auth.uid() = owner);

drop policy if exists "stories_public_read" on storage.objects;
create policy "stories_public_read" on storage.objects
  for select using (bucket_id = 'stories');

drop policy if exists "stories_insert" on storage.objects;
create policy "stories_insert" on storage.objects
  for insert with check (bucket_id = 'stories' and auth.uid() = owner);

drop policy if exists "stories_update" on storage.objects;
create policy "stories_update" on storage.objects
  for update using (bucket_id = 'stories' and auth.uid() = owner);

drop policy if exists "stories_delete" on storage.objects;
create policy "stories_delete" on storage.objects
  for delete using (bucket_id = 'stories' and auth.uid() = owner);


-- ======================================================
-- 9. STORY VIEWS + COVER PHOTO + CHAT IMAGES + AUTO-DELETE
-- ======================================================

-- Story views (who saw which story)
create table if not exists public.story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (story_id, user_id)
);

alter table public.story_views enable row level security;

drop policy if exists "story_views_select" on public.story_views;
create policy "story_views_select" on public.story_views
  for select using (true);

drop policy if exists "story_views_insert" on public.story_views;
create policy "story_views_insert" on public.story_views
  for insert with check (auth.uid() = user_id);

drop policy if exists "story_views_delete" on public.story_views;
create policy "story_views_delete" on public.story_views
  for delete using (auth.uid() = user_id);

-- Cover photo column
alter table public.profiles
  add column if not exists cover_url text;

-- Chat media column
alter table public.messages
  add column if not exists media_url text;

-- Chat images bucket
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

drop policy if exists "chat_images_public_read" on storage.objects;
create policy "chat_images_public_read" on storage.objects
  for select using (bucket_id = 'chat-images');

drop policy if exists "chat_images_insert" on storage.objects;
create policy "chat_images_insert" on storage.objects
  for insert with check (bucket_id = 'chat-images' and auth.uid() = owner);

drop policy if exists "chat_images_update" on storage.objects;
create policy "chat_images_update" on storage.objects
  for update using (bucket_id = 'chat-images' and auth.uid() = owner);

drop policy if exists "chat_images_delete" on storage.objects;
create policy "chat_images_delete" on storage.objects
  for delete using (bucket_id = 'chat-images' and auth.uid() = owner);

-- Auto-delete expired stories (every hour via pg_cron)
do $$
begin
  create extension if not exists pg_cron;
exception
  when others then null;
end $$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'delete-expired-stories') then
    perform cron.unschedule('delete-expired-stories');
  end if;
  perform cron.schedule(
    'delete-expired-stories',
    '0 * * * *',
    $sql$ delete from public.stories where expires_at < now(); $sql$
  );
exception
  when others then null;
end $$;
