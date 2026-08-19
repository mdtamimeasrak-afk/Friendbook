import { supabase } from "@/lib/supabase";
import { notificationService } from "@/services/notificationService";
import type { FeedPost, Post, PostEngagement, PostWithProfile } from "@/types/database";

export interface PostFeedResult {
  posts: FeedPost[];
  error: string | null;
}

const POST_SELECT = "*, profiles (id, full_name, username, avatar_url)";

const PAGE_SIZE = 12;

/**
 * Post service - posts table. RLS: everyone can read posts,
 * only the author can insert/update/delete. Likes/comments/shares
 * and saved_posts are read through their own RLS policies.
 */
export const postService = {
  PAGE_SIZE,

  async getFeedPosts(page = 0, pageSize = PAGE_SIZE): Promise<PostFeedResult> {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      return { posts: [], error: error.message };
    }

    const rawPosts = (data ?? []) as PostWithProfile[];
    const posts = await this.attachEngagement(rawPosts);
    return { posts, error: null };
  },

  async getUserPosts(userId: string, page = 0, pageSize = PAGE_SIZE): Promise<PostFeedResult> {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("user_id", userId)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      return { posts: [], error: error.message };
    }

    const rawPosts = (data ?? []) as PostWithProfile[];
    const posts = await this.attachEngagement(rawPosts);
    return { posts, error: null };
  },

  async getPostCount(userId: string): Promise<{ count: number; error: string | null }> {
    const { count, error } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("archived", false);

    if (error) {
      return { count: 0, error: error.message };
    }
    return { count: count ?? 0, error: null };
  },

  /** Posts that carry a photo - used for the profile photos grid. */
  async getPhotoPosts(userId: string, limit = 30): Promise<PostFeedResult> {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("user_id", userId)
      .eq("archived", false)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { posts: [], error: error.message };
    }

    const rawPosts = (data ?? []) as PostWithProfile[];
    const posts = await this.attachEngagement(rawPosts);
    return { posts, error: null };
  },

  async getPostById(postId: string): Promise<{ post: FeedPost | null; error: string | null }> {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("id", postId)
      .eq("archived", false)
      .maybeSingle();

    if (error) {
      return { post: null, error: error.message };
    }
    const [enriched] = await this.attachEngagement(data ? [data as PostWithProfile] : []);
    return { post: enriched ?? null, error: null };
  },

  /**
   * Attach like/comment/share counts + the current user's state
   * to a batch of posts using 3 aggregate queries (no N+1).
   */
  async attachEngagement(posts: PostWithProfile[]): Promise<FeedPost[]> {
    if (posts.length === 0) {
      return [];
    }
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const postIds = posts.map((post) => post.id);

    const [likesData, commentsData, sharesData, savedData, myLikesData] = await Promise.all([
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
      supabase.from("post_shares").select("post_id").in("post_id", postIds),
      userId ? supabase.from("saved_posts").select("post_id").in("post_id", postIds).eq("user_id", userId) : Promise.resolve({ data: [] as { post_id: string }[], error: null }),
      userId ? supabase.from("likes").select("post_id, reaction").in("post_id", postIds).eq("user_id", userId) : Promise.resolve({ data: [] as { post_id: string; reaction: string }[], error: null }),
    ]);

    const likeCounts = new Map<string, number>();
    (likesData.data ?? []).forEach((row) => {
      likeCounts.set(row.post_id, (likeCounts.get(row.post_id) ?? 0) + 1);
    });
    const commentCounts = new Map<string, number>();
    (commentsData.data ?? []).forEach((row) => {
      commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
    });
    const shareCounts = new Map<string, number>();
    (sharesData.data ?? []).forEach((row) => {
      shareCounts.set(row.post_id, (shareCounts.get(row.post_id) ?? 0) + 1);
    });
    const savedIds = new Set((savedData.data ?? []).map((row) => row.post_id));
    const myLikeMap = new Map<string, string>();
    (myLikesData.data ?? []).forEach((row) => {
      myLikeMap.set(row.post_id, row.reaction);
    });

    return posts.map((post) => ({
      ...post,
      engagement: {
        likeCount: likeCounts.get(post.id) ?? 0,
        commentCount: commentCounts.get(post.id) ?? 0,
        shareCount: shareCounts.get(post.id) ?? 0,
        likedByMe: myLikeMap.has(post.id),
        myReaction: myLikeMap.get(post.id) ?? null,
        savedByMe: savedIds.has(post.id),
      },
    }));
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; error: string | null }> {
    const { data: existing, error: findError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (findError) {
      return { liked: false, error: findError.message };
    }

    if (existing) {
      const { error } = await supabase.from("likes").delete().eq("id", existing.id);
      return { liked: false, error: error?.message ?? null };
    }

    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId, reaction: "like" });
    if (!error) {
      // Notify the post owner (no self-notifications; matches website).
      await notificationService.notifyPostOwner(postId, userId, "like");
    }
    return { liked: true, error: error?.message ?? null };
  },

  async isSaved(postId: string, userId: string): Promise<{ saved: boolean; error: string | null }> {
    const { data, error } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { saved: false, error: error.message };
    }
    return { saved: Boolean(data), error: null };
  },

  async toggleSave(postId: string, userId: string): Promise<{ saved: boolean; error: string | null }> {
    const { saved } = await this.isSaved(postId, userId);
    if (saved) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      return { saved: false, error: error?.message ?? null };
    }
    const { error } = await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId });
    return { saved: true, error: error?.message ?? null };
  },

  async createPost(input: {
    userId: string;
    content: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    background?: string | null;
    audience?: string;
  }): Promise<{ post: Post | null; error: string | null }> {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: input.userId,
        content: input.content,
        image_url: input.imageUrl ?? null,
        video_url: input.videoUrl ?? null,
        background: input.background ?? null,
        audience: input.audience ?? "public",
      })
      .select()
      .maybeSingle();

    if (error) {
      return { post: null, error: error.message };
    }
    return { post: data, error: null };
  },

  async deletePost(postId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    return { error: error?.message ?? null };
  },

  /**
   * Edits an existing post (content + audience - the same fields the
   * website's edit modal supports; media cannot be changed).
   */
  async updatePost(postId: string, input: { content: string; audience?: string }): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("posts")
      .update({ content: input.content.trim(), audience: input.audience ?? "public" })
      .eq("id", postId);
    return { error: error?.message ?? null };
  },

  /**
   * SocialHub share URL, matching the website (shares.js):
   * {origin}/profile/user-profile.html?user={authorId}#post-{postId}
   * Only public posts get a link - private content must not leak.
   */
  getShareUrl(post: { id: string; user_id: string; audience: string }): string | null {
    if (post.audience !== "public") {
      return null;
    }
    return `https://friendbook-78z.pages.dev/profile/user-profile.html?user=${post.user_id}#post-${post.id}`;
  },
};