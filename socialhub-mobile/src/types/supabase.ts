/**
 * Supabase client type map.
 * Keeps createClient<Database>() type-safe without needing the
 * Supabase CLI. Row types come from ./database (the real schema);
 * Insert/Update are derived from them. GenericSchema requires a
 * `Relationships` field on every table.
 */

import type {
  Album,
  AlbumPhoto,
  AppEvent,
  AppNotification,
  Block,
  Campus,
  CampusGroup,
  CampusGroupMember,
  CampusMember,
  CampusPost,
  CampusPostComment,
  CampusPostLike,
  CampusPostShare,
  Comment,
  DeviceToken,
  EventRsvp,
  Friendship,
  Group,
  GroupMember,
  Like,
  LiveSession,
  MarketplaceItem,
  Message,
  Page,
  PageFollower,
  Post,
  PostShare,
  PostView,
  Profile,
  Report,
  SavedPost,
  Story,
  StoryView,
} from "./database";

type Insertable<T> = Partial<Omit<T, "id" | "created_at">>;
type Updatable<T> = Partial<T>;

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Insertable<Profile> & { id: string }, Updatable<Profile>>;
      posts: Table<Post, Insertable<Post> & { user_id: string; content?: string }, Updatable<Post>>;
      likes: Table<Like, Insertable<Like> & { post_id: string; user_id: string }, Updatable<Like>>;
      comments: Table<
        Comment,
        Insertable<Comment> & { post_id: string; user_id: string; content: string },
        Updatable<Comment>
      >;
      post_shares: Table<PostShare, Insertable<PostShare> & { post_id: string; user_id: string }, Updatable<PostShare>>;
      friendships: Table<
        Friendship,
        Insertable<Friendship> & { requester_id: string; addressee_id: string },
        Updatable<Friendship>
      >;
      notifications: Table<
        AppNotification,
        Insertable<AppNotification> & { user_id: string; type?: string },
        Updatable<AppNotification>
      >;
      saved_posts: Table<SavedPost, Insertable<SavedPost> & { user_id: string; post_id: string }, Updatable<SavedPost>>;
      messages: Table<
        Message,
        Insertable<Message> & { sender_id: string; receiver_id: string; content?: string },
        Updatable<Message>
      >;
      stories: Table<Story, Insertable<Story> & { user_id: string; media_url: string }, Updatable<Story>>;
      story_views: Table<
        StoryView,
        Insertable<StoryView> & { story_id: string; user_id: string },
        Updatable<StoryView>
      >;
      blocks: Table<Block, Insertable<Block> & { blocker_id: string; user_id: string }, Updatable<Block>>;
      groups: Table<Group, Insertable<Group> & { name: string; created_by: string }, Updatable<Group>>;
      group_members: Table<
        GroupMember,
        Insertable<GroupMember> & { group_id: string; user_id: string },
        Updatable<GroupMember>
      >;
      events: Table<
        AppEvent,
        Insertable<AppEvent> & { title: string; event_date: string; created_by: string },
        Updatable<AppEvent>
      >;
      event_rsvps: Table<EventRsvp, Insertable<EventRsvp> & { event_id: string; user_id: string }, Updatable<EventRsvp>>;
      pages: Table<Page, Insertable<Page> & { name: string; created_by: string }, Updatable<Page>>;
      page_followers: Table<
        PageFollower,
        Insertable<PageFollower> & { page_id: string; user_id: string },
        Updatable<PageFollower>
      >;
      marketplace_items: Table<
        MarketplaceItem,
        Insertable<MarketplaceItem> & { seller_id: string; title: string },
        Updatable<MarketplaceItem>
      >;
      albums: Table<Album, Insertable<Album> & { user_id: string; name: string }, Updatable<Album>>;
      album_photos: Table<
        AlbumPhoto,
        Insertable<AlbumPhoto> & { album_id: string; image_url: string },
        Updatable<AlbumPhoto>
      >;
      reports: Table<Report, Insertable<Report> & { reporter_id: string; reason: string }, Updatable<Report>>;
      live_sessions: Table<LiveSession, Insertable<LiveSession> & { host_id: string }, Updatable<LiveSession>>;
      post_views: Table<PostView, Insertable<PostView> & { post_id: string; viewer_id: string }, Updatable<PostView>>;
      campuses: Table<Campus, Insertable<Campus> & { name: string }, Updatable<Campus>>;
      campus_members: Table<
        CampusMember,
        Insertable<CampusMember> & { campus_id: string; user_id: string },
        Updatable<CampusMember>
      >;
      campus_posts: Table<
        CampusPost,
        Insertable<CampusPost> & { campus_id: string; user_id: string },
        Updatable<CampusPost>
      >;
      campus_post_likes: Table<
        CampusPostLike,
        Insertable<CampusPostLike> & { campus_post_id: string; user_id: string },
        Updatable<CampusPostLike>
      >;
      campus_post_comments: Table<
        CampusPostComment,
        Insertable<CampusPostComment> & { campus_post_id: string; user_id: string; content: string },
        Updatable<CampusPostComment>
      >;
      campus_groups: Table<
        CampusGroup,
        Insertable<CampusGroup> & { campus_id: string; name: string; created_by: string },
        Updatable<CampusGroup>
      >;
      campus_group_members: Table<
        CampusGroupMember,
        Insertable<CampusGroupMember> & { group_id: string; user_id: string },
        Updatable<CampusGroupMember>
      >;
      campus_post_shares: Table<
        CampusPostShare,
        Insertable<CampusPostShare> & { campus_post_id: string; user_id: string },
        Updatable<CampusPostShare>
      >;
      device_tokens: Table<
        DeviceToken,
        Insertable<DeviceToken> & { user_id: string; device_token: string },
        Updatable<DeviceToken>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};