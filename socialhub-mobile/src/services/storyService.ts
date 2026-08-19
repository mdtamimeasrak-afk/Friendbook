import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";
import type { Profile, Story, StoryMediaType } from "@/types/database";

export interface StoryFeedItem {
  user: Pick<Profile, "id" | "full_name" | "username" | "avatar_url">;
  stories: Story[];
}

export interface StoryFeedResult {
  feed: StoryFeedItem[];
  mySeenStoryIds: Set<string>;
  error: string | null;
}

/**
 * Story service - stories + story_views tables.
 * RLS: everyone can read stories; only the author can create/delete.
 * Expired stories are removed by the pg_cron cleanup job.
 */
export const storyService = {
  async getActiveStories(meId: string): Promise<StoryFeedResult> {
    const { data: stories, error } = await supabase
      .from("stories")
      .select("id, user_id, media_url, media_type, caption, created_at, expires_at, archived")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return { feed: [], mySeenStoryIds: new Set(), error: error.message };
    }

    const { data: myViews } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("user_id", meId);

    const mySeenStoryIds = new Set((myViews ?? []).map((view) => view.story_id));

    const grouped = new Map<string, Story[]>();
    (stories ?? []).forEach((story) => {
      const list = grouped.get(story.user_id) ?? [];
      list.push(story);
      grouped.set(story.user_id, list);
    });

    const userIds = [...grouped.keys()];
    let profileMap = new Map<string, Pick<Profile, "id" | "full_name" | "username" | "avatar_url">>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

      (profiles ?? []).forEach((profile) => {
        profileMap.set(profile.id, profile);
      });
    }

    const feed: StoryFeedItem[] = [...grouped.entries()].map(([userId, userStories]) => ({
      user:
        profileMap.get(userId) ?? { id: userId, full_name: null, username: null, avatar_url: null },
      stories: userStories.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }));

    return { feed, mySeenStoryIds, error: null };
  },

  async getStoryById(storyId: string): Promise<{ story: Story | null; error: string | null }> {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .maybeSingle();

    if (error) {
      return { story: null, error: toFriendlyError(error, "Could not load this story.") };
    }
    return { story: data, error: null };
  },

  /** A single user's active (unexpired) stories, newest first. */
  async getStoriesForUser(userId: string): Promise<{ stories: Story[]; error: string | null }> {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      return { stories: [], error: toFriendlyError(error, "Could not load this story.") };
    }
    return { stories: (data ?? []) as Story[], error: null };
  },

  async createStory(input: {
    userId: string;
    mediaUrl: string;
    mediaType: StoryMediaType | string;
    caption?: string | null;
  }): Promise<{ story: Story | null; error: string | null }> {
    const { data, error } = await supabase
      .from("stories")
      .insert({
        user_id: input.userId,
        media_url: input.mediaUrl,
        media_type: input.mediaType === "video" ? "video" : "image",
        caption: input.caption?.trim() || null,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      return { story: null, error: toFriendlyError(error, "Could not publish your story.") };
    }
    return { story: data, error: null };
  },

  async deleteStory(storyId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("stories").delete().eq("id", storyId);
    return { error: error ? toFriendlyError(error, "Could not delete this story.") : null };
  },

  async markViewed(storyId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("story_views").upsert(
      { story_id: storyId, user_id: userId },
      { onConflict: "story_id,user_id" }
    );
    return { error: error ? toFriendlyError(error, "Could not update story views.") : null };
  },
};
