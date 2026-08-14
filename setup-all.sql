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

-- Archived posts (Profile More -> Archive)
alter table public.posts
  add column if not exists archived boolean not null default false;

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

-- Archived stories (Profile More -> Story archive)
alter table public.stories
  add column if not exists archived boolean not null default false;

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
    $sql$ delete from public.stories where expires_at < now() and archived = false; $sql$
  );
exception
  when others then null;
end $$;

-- ======================================================
-- PHASE 2: PRIVACY & ACCOUNT
-- ======================================================

-- Blocked users
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, user_id)
);

alter table public.blocks enable row level security;

drop policy if exists "blocks_select" on public.blocks;
create policy "blocks_select" on public.blocks
  for select using (auth.uid() = blocker_id);

drop policy if exists "blocks_insert" on public.blocks;
create policy "blocks_insert" on public.blocks
  for insert with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete" on public.blocks;
create policy "blocks_delete" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- Deactivated accounts (soft delete)
alter table public.profiles
  add column if not exists deactivated boolean not null default false;

-- ======================================================
-- PHASE 4: COMMUNITIES (Groups / Events / Pages)
-- ======================================================

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select using (true);

drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert" on public.groups
  for insert with check (auth.uid() = created_by);

drop policy if exists "groups_update" on public.groups;
create policy "groups_update" on public.groups
  for update using (auth.uid() = created_by);

drop policy if exists "groups_delete" on public.groups;
create policy "groups_delete" on public.groups
  for delete using (auth.uid() = created_by);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table public.group_members enable row level security;

drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select" on public.group_members
  for select using (true);

drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert" on public.group_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "group_members_update" on public.group_members;
create policy "group_members_update" on public.group_members
  for update using (auth.uid() = user_id);

drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete" on public.group_members
  for delete using (auth.uid() = user_id);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text not null default '',
  event_date timestamptz not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select using (true);

drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert with check (auth.uid() = created_by);

drop policy if exists "events_update" on public.events;
create policy "events_update" on public.events
  for update using (auth.uid() = created_by);

drop policy if exists "events_delete" on public.events;
create policy "events_delete" on public.events
  for delete using (auth.uid() = created_by);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'going',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_rsvps enable row level security;

drop policy if exists "event_rsvps_select" on public.event_rsvps;
create policy "event_rsvps_select" on public.event_rsvps
  for select using (true);

drop policy if exists "event_rsvps_insert" on public.event_rsvps;
create policy "event_rsvps_insert" on public.event_rsvps
  for insert with check (auth.uid() = user_id);

drop policy if exists "event_rsvps_update" on public.event_rsvps;
create policy "event_rsvps_update" on public.event_rsvps
  for update using (auth.uid() = user_id);

drop policy if exists "event_rsvps_delete" on public.event_rsvps;
create policy "event_rsvps_delete" on public.event_rsvps
  for delete using (auth.uid() = user_id);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.pages enable row level security;

drop policy if exists "pages_select" on public.pages;
create policy "pages_select" on public.pages
  for select using (true);

drop policy if exists "pages_insert" on public.pages;
create policy "pages_insert" on public.pages
  for insert with check (auth.uid() = created_by);

drop policy if exists "pages_update" on public.pages;
create policy "pages_update" on public.pages
  for update using (auth.uid() = created_by);

drop policy if exists "pages_delete" on public.pages;
create policy "pages_delete" on public.pages
  for delete using (auth.uid() = created_by);

create table if not exists public.page_followers (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (page_id, user_id)
);

alter table public.page_followers enable row level security;

drop policy if exists "page_followers_select" on public.page_followers;
create policy "page_followers_select" on public.page_followers
  for select using (true);

drop policy if exists "page_followers_insert" on public.page_followers;
create policy "page_followers_insert" on public.page_followers
  for insert with check (auth.uid() = user_id);

drop policy if exists "page_followers_delete" on public.page_followers;
create policy "page_followers_delete" on public.page_followers
  for delete using (auth.uid() = user_id);

-- Group / page posts live in the posts table
alter table public.posts
  add column if not exists group_id uuid references public.groups (id) on delete cascade;

alter table public.posts
  add column if not exists page_id uuid references public.pages (id) on delete cascade;


-- ======================================================
-- PHASE 5 - EXTRA FACEBOOK FEATURES
-- ======================================================

-- 5.1 MARKETPLACE
create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text default '',
  price numeric not null default 0,
  category text default 'Other',
  condition text default 'New',
  image_url text,
  sold boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.marketplace_items enable row level security;

drop policy if exists "marketplace_items_select" on public.marketplace_items;
create policy "marketplace_items_select" on public.marketplace_items
  for select using (auth.uid() is not null);

drop policy if exists "marketplace_items_insert" on public.marketplace_items;
create policy "marketplace_items_insert" on public.marketplace_items
  for insert with check (auth.uid() = seller_id);

drop policy if exists "marketplace_items_update" on public.marketplace_items;
create policy "marketplace_items_update" on public.marketplace_items
  for update using (auth.uid() = seller_id);

drop policy if exists "marketplace_items_delete" on public.marketplace_items;
create policy "marketplace_items_delete" on public.marketplace_items
  for delete using (auth.uid() = seller_id);

do $$
begin
  alter publication supabase_realtime add table public.marketplace_items;
exception
  when duplicate_object then null;
end $$;


-- 5.2 PHOTO ALBUMS
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text default '',
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  image_url text not null,
  caption text default '',
  created_at timestamptz not null default now()
);

alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

-- Albums: owner or accepted friends can view; owner manages
drop policy if exists "albums_select" on public.albums;
create policy "albums_select" on public.albums
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = albums.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = albums.user_id)
        )
    )
  );

drop policy if exists "albums_insert" on public.albums;
create policy "albums_insert" on public.albums
  for insert with check (auth.uid() = user_id);

drop policy if exists "albums_update" on public.albums;
create policy "albums_update" on public.albums
  for update using (auth.uid() = user_id);

drop policy if exists "albums_delete" on public.albums;
create policy "albums_delete" on public.albums
  for delete using (auth.uid() = user_id);

drop policy if exists "album_photos_select" on public.album_photos;
create policy "album_photos_select" on public.album_photos
  for select using (
    exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id
        and (
          a.user_id = auth.uid()
          or exists (
            select 1 from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.addressee_id = a.user_id)
                or (f.addressee_id = auth.uid() and f.requester_id = a.user_id)
              )
          )
        )
    )
  );

drop policy if exists "album_photos_insert" on public.album_photos;
create policy "album_photos_insert" on public.album_photos
  for insert with check (
    exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "album_photos_update" on public.album_photos;
create policy "album_photos_update" on public.album_photos
  for update using (
    exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "album_photos_delete" on public.album_photos;
create policy "album_photos_delete" on public.album_photos
  for delete using (
    exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id and a.user_id = auth.uid()
    )
  );


-- 5.3 REPORTS (moderation)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "reports_select" on public.reports;
create policy "reports_select" on public.reports
  for select using (auth.uid() = reporter_id);


-- 5.4 MESSAGE STATUSES (seen receipts + online)
alter table public.messages
  add column if not exists read_at timestamptz;

alter table public.profiles
  add column if not exists last_seen timestamptz;


-- 5.5 LIVE VIDEO (experimental)
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Live',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.live_sessions enable row level security;

drop policy if exists "live_sessions_select" on public.live_sessions;
create policy "live_sessions_select" on public.live_sessions
  for select using (auth.uid() is not null);

drop policy if exists "live_sessions_insert" on public.live_sessions;
create policy "live_sessions_insert" on public.live_sessions
  for insert with check (auth.uid() = host_id);

drop policy if exists "live_sessions_update" on public.live_sessions;
create policy "live_sessions_update" on public.live_sessions
  for update using (auth.uid() = host_id);

drop policy if exists "live_sessions_delete" on public.live_sessions;
create policy "live_sessions_delete" on public.live_sessions
  for delete using (auth.uid() = host_id);

do $$
begin
  alter publication supabase_realtime add table public.live_sessions;
exception
  when duplicate_object then null;
end $$;

-- ======================================================
-- PHASE 6: POWER FEATURES
-- ======================================================

-- 6.1 POST VIEWS (activity log / seen by)
create table if not exists public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, viewer_id)
);

alter table public.post_views enable row level security;

drop policy if exists "post_views_select" on public.post_views;
create policy "post_views_select" on public.post_views
  for select using (
    exists (
      select 1 from public.posts p
      where p.id = post_views.post_id and p.user_id = auth.uid()
    )
    or auth.uid() = post_views.viewer_id
  );

drop policy if exists "post_views_insert" on public.post_views;
create policy "post_views_insert" on public.post_views
  for insert with check (auth.uid() = viewer_id);

drop policy if exists "post_views_delete" on public.post_views;
create policy "post_views_delete" on public.post_views
  for delete using (
    auth.uid() = post_views.viewer_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- 6.2 ADMIN FLAG
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 6.3 COMMENTS: edit own comment
drop policy if exists "comments_update" on public.comments;
create policy "comments_update" on public.comments
  for update using (auth.uid() = user_id);

-- 6.4 GROUPS: cover image + member roles
alter table public.groups
  add column if not exists cover_url text;

-- Creator becomes owner; backfill old data
insert into public.group_members (group_id, user_id, role)
  select g.id, g.created_by, 'owner'
  from public.groups g
on conflict (group_id, user_id)
  do update set role = 'owner';

-- Role changes (promote/demote) only by owner or admins
drop policy if exists "group_members_update" on public.group_members;
create policy "group_members_update" on public.group_members
  for update using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  );

-- Owner/admin may invite others (insert rows for any user in their group)
drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert" on public.group_members
  for insert with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  );

-- 6.5 EVENTS: cover image + invite friends
alter table public.events
  add column if not exists cover_url text;


-- Event creator may invite others (status 'invited')
drop policy if exists "event_rsvps_insert" on public.event_rsvps;
create policy "event_rsvps_insert" on public.event_rsvps
  for insert with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.events e
      where e.id = event_rsvps.event_id and e.created_by = auth.uid()
    )
  );


-- 6.6 ADMIN: view all reports
drop policy if exists "reports_select" on public.reports;
create policy "reports_select" on public.reports
  for select using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- 6.7 ADMIN: dismiss reports + harden is_admin (no self-promotion)
drop policy if exists "reports_delete" on public.reports;
create policy "reports_delete" on public.reports
  for delete using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    auth.uid() = id
    and (
      is_admin = false
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin = true
      )
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Give the test account admin rights (so the admin dashboard can be tested)
update public.profiles
  set is_admin = true
  where id = '20e7c3e4-e1b9-4a85-a8d2-73d1381d1fc8';


-- 6.8 GROUPS: owner/admin may remove members (old policy was self-leave only)
drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete" on public.group_members
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('owner', 'admin')
    )
  );


-- 7.0 CAMPUS COMMUNITY (Step 2: campuses + campus_members tables, RLS)
-- 7.1 CAMPUSES table (one row per campus; e.g. Bogra Polytechnic Institute)
create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  location text,
  description text,
  logo_url text,
  cover_url text,
  verified boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
alter table public.campuses enable row level security;
drop policy if exists campuses_select on public.campuses;
create policy campuses_select on public.campuses for select to authenticated using (true);
drop policy if exists campuses_insert on public.campuses;
create policy campuses_insert on public.campuses for insert to authenticated with check (true);
drop policy if exists campuses_update on public.campuses;
create policy campuses_update on public.campuses for update to authenticated using (created_by = auth.uid());
drop policy if exists campuses_delete on public.campuses;
create policy campuses_delete on public.campuses for delete to authenticated using (created_by = auth.uid());

-- 7.2 CAMPUS_MEMBERS table (who joined which campus; unique = no double join)
create table if not exists public.campus_members (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'student',
  joined_at timestamptz not null default now(),
  unique (campus_id, user_id)
);
alter table public.campus_members enable row level security;
drop policy if exists campus_members_select on public.campus_members;
create policy campus_members_select on public.campus_members for select to authenticated using (true);
drop policy if exists campus_members_insert on public.campus_members;
create policy campus_members_insert on public.campus_members for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists campus_members_update on public.campus_members;
create policy campus_members_update on public.campus_members for update to authenticated using (auth.uid() = user_id);
drop policy if exists campus_members_delete on public.campus_members;
create policy campus_members_delete on public.campus_members for delete to authenticated using (auth.uid() = user_id);

-- 7.3 Seed: Bogra Polytechnic Institute (logo/cover/verified)
insert into public.campuses (name, short_name, location, description, verified, created_by)
values ('Bogra Polytechnic Institute', 'BPI', 'Bogra, Bangladesh', 'Polytechnic Institute in Bogra - Official TRIYA Campus', true, '20e7c3e4-e1b9-4a85-a8d2-73d1381d1fc8')
on conflict do nothing;

-- 8.0 CAMPUS COMMUNITY (Step 4: campus_posts + likes + comments)
-- 8.1 CAMPUS_POSTS: text/image posts; only campus members may post
create table if not exists public.campus_posts (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.campus_posts enable row level security;
drop policy if exists campus_posts_select on public.campus_posts;
create policy campus_posts_select on public.campus_posts for select to authenticated using (true);
drop policy if exists campus_posts_insert on public.campus_posts;
create policy campus_posts_insert on public.campus_posts for insert to authenticated with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.campus_members cm
    where cm.campus_id = campus_posts.campus_id
      and cm.user_id = auth.uid()
  )
);
drop policy if exists campus_posts_update on public.campus_posts;
create policy campus_posts_update on public.campus_posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists campus_posts_delete on public.campus_posts;
create policy campus_posts_delete on public.campus_posts for delete to authenticated using (
  auth.uid() = user_id
  or exists (
    select 1 from public.campus_members cm
    where cm.campus_id = campus_posts.campus_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);

-- 8.2 CAMPUS_POST_LIKES: one reaction per user per campus post
create table if not exists public.campus_post_likes (
  id uuid primary key default gen_random_uuid(),
  campus_post_id uuid not null references public.campus_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique (campus_post_id, user_id)
);
alter table public.campus_post_likes enable row level security;
drop policy if exists campus_post_likes_select on public.campus_post_likes;
create policy campus_post_likes_select on public.campus_post_likes for select to authenticated using (true);
drop policy if exists campus_post_likes_insert on public.campus_post_likes;
create policy campus_post_likes_insert on public.campus_post_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists campus_post_likes_update on public.campus_post_likes;
create policy campus_post_likes_update on public.campus_post_likes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists campus_post_likes_delete on public.campus_post_likes;
create policy campus_post_likes_delete on public.campus_post_likes for delete to authenticated using (auth.uid() = user_id);

-- 8.3 CAMPUS_POST_COMMENTS
create table if not exists public.campus_post_comments (
  id uuid primary key default gen_random_uuid(),
  campus_post_id uuid not null references public.campus_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.campus_post_comments enable row level security;
drop policy if exists campus_post_comments_select on public.campus_post_comments;
create policy campus_post_comments_select on public.campus_post_comments for select to authenticated using (true);
drop policy if exists campus_post_comments_insert on public.campus_post_comments;
create policy campus_post_comments_insert on public.campus_post_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists campus_post_comments_delete on public.campus_post_comments;
create policy campus_post_comments_delete on public.campus_post_comments for delete to authenticated using (auth.uid() = user_id);

-- 9.0 CAMPUS COMMUNITY (Step 5: profile fields for students - department, semester, batch)
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists semester text;
alter table public.profiles add column if not exists batch text;


-- 10.0 CAMPUS COMMUNITY (Step 6: campus groups + group members)
-- 10.1 CAMPUS_GROUPS: name/image/description; creator becomes admin; only campus members may create
create table if not exists public.campus_groups (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses (id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.campus_groups enable row level security;
drop policy if exists campus_groups_select on public.campus_groups;
create policy campus_groups_select on public.campus_groups for select to authenticated using (true);
drop policy if exists campus_groups_insert on public.campus_groups;
create policy campus_groups_insert on public.campus_groups for insert to authenticated with check (
  auth.uid() = created_by
  and exists (
    select 1 from public.campus_members cm
    where cm.campus_id = campus_groups.campus_id
      and cm.user_id = auth.uid()
  )
);
drop policy if exists campus_groups_update on public.campus_groups;
create policy campus_groups_update on public.campus_groups for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists campus_groups_delete on public.campus_groups;
create policy campus_groups_delete on public.campus_groups for delete to authenticated using (created_by = auth.uid());

-- 10.2 CAMPUS_GROUP_MEMBERS: join/leave; unique = no double join
create table if not exists public.campus_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.campus_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
alter table public.campus_group_members enable row level security;
drop policy if exists campus_group_members_select on public.campus_group_members;
create policy campus_group_members_select on public.campus_group_members for select to authenticated using (true);
drop policy if exists campus_group_members_insert on public.campus_group_members;
create policy campus_group_members_insert on public.campus_group_members for insert to authenticated with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.campus_groups cg
    join public.campus_members cm on cm.campus_id = cg.campus_id
    where cg.id = campus_group_members.group_id
      and cm.user_id = auth.uid()
  )
);
drop policy if exists campus_group_members_update on public.campus_group_members;
create policy campus_group_members_update on public.campus_group_members for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists campus_group_members_delete on public.campus_group_members;
create policy campus_group_members_delete on public.campus_group_members for delete to authenticated using (
  auth.uid() = user_id
  or exists (
    select 1 from public.campus_groups cg
    where cg.id = campus_group_members.group_id
      and cg.created_by = auth.uid()
  )
);

-- 10.3 Seed: starter groups for the first campus (creator = Tamim Easrak)
insert into public.campus_groups (campus_id, name, description, created_by)
select c.id, 'Programming Club', 'Code, hackathons and tech workshops for campus students.', 'b0432f86-5982-44d4-954c-e2fcac39168a'
from public.campuses c order by c.created_at limit 1 on conflict do nothing;
insert into public.campus_groups (campus_id, name, description, created_by)
select c.id, 'Sports Club', 'Football, cricket, badminton and campus tournaments.', 'b0432f86-5982-44d4-954c-e2fcac39168a'
from public.campuses c order by c.created_at limit 1 on conflict do nothing;
insert into public.campus_groups (campus_id, name, description, created_by)
select c.id, 'Cultural Club', 'Music, drama, debates and annual campus events.', 'b0432f86-5982-44d4-954c-e2fcac39168a'
from public.campuses c order by c.created_at limit 1 on conflict do nothing;


-- 11.0 CAMPUS COMMUNITY (Facebook-style upgrade: share + audience)
-- 11.1 post_shares gets an audience (who can see the share)
alter table public.post_shares add column if not exists audience text not null default 'public';
-- 11.2 campus_posts gets an audience (who can see the campus post)
alter table public.campus_posts add column if not exists audience text not null default 'public';
-- 11.3 CAMPUS_POST_SHARES: "X shared Y's campus post" with an optional thought
create table if not exists public.campus_post_shares (
  id uuid primary key default gen_random_uuid(),
  campus_post_id uuid not null references public.campus_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  thought text not null default '',
  created_at timestamptz not null default now()
);
alter table public.campus_post_shares enable row level security;
drop policy if exists campus_post_shares_select on public.campus_post_shares;
create policy campus_post_shares_select on public.campus_post_shares for select to authenticated using (true);
drop policy if exists campus_post_shares_insert on public.campus_post_shares;
create policy campus_post_shares_insert on public.campus_post_shares for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists campus_post_shares_delete on public.campus_post_shares;
create policy campus_post_shares_delete on public.campus_post_shares for delete to authenticated using (auth.uid() = user_id);