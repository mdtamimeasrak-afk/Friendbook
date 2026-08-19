/**
 * SocialHub - Supabase database types.
 * Mirrors the existing production schema (setup-all.sql).
 * Never guess columns here: every field below exists in the schema.
 */

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  work: string | null;
  education: string | null;
  website: string | null;
  birthday: string | null;
  cover_url: string | null;
  deactivated: boolean;
  is_admin: boolean;
  department: string | null;
  semester: string | null;
  batch: string | null;
  last_seen: string | null;
  created_at: string;
}

export type ProfilePublic = Pick<
  Profile,
  "id" | "full_name" | "username" | "avatar_url" | "created_at"
>;

export type PostAudience =
  | "public"
  | "friends"
  | "friends_of_friends"
  | "only_me";

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  background: string | null;
  video_url: string | null;
  audience: PostAudience | string;
  archived: boolean;
  is_pinned: boolean;
  group_id: string | null;
  page_id: string | null;
  created_at: string;
}

export type PostWithProfile = Post & {
  profiles?: ProfilePublic | null;
};

/** Engagement summary + the current user's state for one post. */
export interface PostEngagement {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  myReaction: ReactionType | string | null;
  savedByMe: boolean;
}

/** A feed post with author + engagement, ready for PostCard. */
export type FeedPost = PostWithProfile & {
  engagement: PostEngagement;
};

export type ReactionType =
  | "like"
  | "love"
  | "haha"
  | "wow"
  | "sad"
  | "angry"
  | "care";

export type Like = {
  id: string;
  post_id: string;
  user_id: string;
  reaction: ReactionType | string;
  created_at: string;
}

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

export type PostShare = {
  id: string;
  post_id: string;
  user_id: string;
  thought: string;
  audience: PostAudience | string;
  created_at: string;
}

export type FriendshipStatus = "pending" | "accepted";

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus | string;
  created_at: string;
}

export type NotificationType =
  | "like"
  | "comment"
  | "friend_request"
  | "friend_accepted"
  | "share"
  | "story"
  | "message"
  | "general";

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType | string;
  post_id: string | null;
  content: string | null;
  read: boolean;
  created_at: string;
}

export type SavedPost = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  read_at: string | null;
  media_url: string | null;
  reply_to: string | null;
  created_at: string;
}

export type StoryMediaType = "image" | "video";

export type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: StoryMediaType | string;
  caption: string | null;
  archived: boolean;
  created_at: string;
  expires_at: string;
}

export type StoryView = {
  id: string;
  story_id: string;
  user_id: string;
  viewed_at: string;
}

export type Block = {
  id: string;
  blocker_id: string;
  user_id: string;
  created_at: string;
}

export type Group = {
  id: string;
  name: string;
  description: string;
  cover_url: string | null;
  created_by: string;
  created_at: string;
}

export type GroupMemberRole = "owner" | "admin" | "member";

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole | string;
  created_at: string;
}

export type AppEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  cover_url: string | null;
  created_by: string;
  created_at: string;
}

export type EventRsvp = {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export type Page = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

export type PageFollower = {
  id: string;
  page_id: string;
  user_id: string;
  created_at: string;
}

export type MarketplaceItem = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  condition: string | null;
  image_url: string | null;
  sold: boolean;
  created_at: string;
}

export type Album = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
}

export type AlbumPhoto = {
  id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export type Report = {
  id: string;
  reporter_id: string;
  post_id: string | null;
  reason: string;
  created_at: string;
}

export type LiveSession = {
  id: string;
  host_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
}

export type PostView = {
  id: string;
  post_id: string;
  viewer_id: string;
  created_at: string;
}

export type Campus = {
  id: string;
  name: string;
  short_name: string | null;
  location: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  verified: boolean;
  created_by: string | null;
  created_at: string;
}

export type CampusMember = {
  id: string;
  campus_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export type CampusPost = {
  id: string;
  campus_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  audience: PostAudience | string;
  created_at: string;
}

export type CampusPostLike = {
  id: string;
  campus_post_id: string;
  user_id: string;
  reaction: ReactionType | string;
  created_at: string;
}

export type CampusPostComment = {
  id: string;
  campus_post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export type CampusGroup = {
  id: string;
  campus_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
}

export type CampusGroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export type CampusPostShare = {
  id: string;
  campus_post_id: string;
  user_id: string;
  thought: string;
  created_at: string;
}

/** Push device token (mobile). Owner-only RLS - never readable by others. */
export type DeviceToken = {
  id: string;
  user_id: string;
  device_token: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

/**
 * Storage buckets (all public read):
 * avatars, post-images, videos, stories, chat-images
 */
export type StorageBucket =
  | "avatars"
  | "post-images"
  | "videos"
  | "stories"
  | "chat-images";
