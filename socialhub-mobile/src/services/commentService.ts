import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";
import { notificationService } from "@/services/notificationService";
import type { Comment, ProfilePublic } from "@/types/database";

export type CommentWithProfile = Comment & {
  profiles: ProfilePublic | null;
};

export interface CommentPageResult {
  comments: CommentWithProfile[];
  error: string | null;
}

export interface CommentResult {
  comment: CommentWithProfile | null;
  error: string | null;
}

const COMMENT_SELECT = "*, profiles (id, full_name, username, avatar_url)";

/**
 * Comment service - comments table. RLS: everyone can read;
 * only the author can insert/delete (no update policy exists,
 * so comment editing is intentionally not offered).
 */
export const commentService = {
  PAGE_SIZE: 20,

  async getComments(postId: string, page = 0, pageSize = 20): Promise<CommentPageResult> {
    const { data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      return { comments: [], error: toFriendlyError(error, "Could not load comments.") };
    }
    return { comments: (data ?? []) as CommentWithProfile[], error: null };
  },

  async createComment(postId: string, userId: string, content: string): Promise<CommentResult> {
    const trimmed = content.trim();
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: userId, content: trimmed })
      .select(COMMENT_SELECT)
      .maybeSingle();

    if (error) {
      return { comment: null, error: toFriendlyError(error, "Could not post your comment.") };
    }
    if (data) {
      // Notify the post owner (no self-notifications; matches website).
      await notificationService.notifyPostOwner(postId, userId, "comment", trimmed.slice(0, 120));
    }
    return { comment: data as CommentWithProfile | null, error: null };
  },

  async deleteComment(commentId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    return { error: error ? toFriendlyError(error, "Could not delete this comment.") : null };
  },
};