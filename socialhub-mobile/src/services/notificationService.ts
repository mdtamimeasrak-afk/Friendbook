import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";
import type { AppNotification, Profile } from "@/types/database";

export interface NotificationsResult {
  notifications: AppNotification[];
  error: string | null;
}

export interface NotificationFeedItem extends AppNotification {
  actor: Pick<Profile, "id" | "full_name" | "username" | "avatar_url"> | null;
}

export interface NotificationFeedResult {
  notifications: NotificationFeedItem[];
  error: string | null;
}

export interface NotificationCreateInput {
  userId: string;
  actorId: string;
  type: string;
  postId?: string | null;
  content?: string | null;
}

const PAGE_SIZE = 20;

function toFriendly(message: string | null, fallback: string): string | null {
  return message ? toFriendlyError({ message }, fallback) : null;
}

/**
 * Notification service - notifications table.
 * RLS: only the receiving user can select/update/delete; inserts require
 * the actor to be the current user (so notifications are created from
 * the acting user's client - exactly like the website's socialhubNotify).
 */
export const notificationService = {
  PAGE_SIZE,

  async getNotifications(limit = 50): Promise<NotificationsResult> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, actor_id, type, post_id, content, read, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { notifications: [], error: toFriendlyError(error, "Could not load notifications.") };
    }
    return { notifications: data ?? [], error: null };
  },

  /** Paginated notifications for the current user. */
  async getFeed(page = 0, pageSize = PAGE_SIZE): Promise<NotificationFeedResult> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, actor_id, type, post_id, content, read, created_at")
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      return { notifications: [], error: toFriendlyError(error, "Could not load notifications.") };
    }

    const actorIds = [...new Set((data ?? []).map((item) => item.actor_id).filter((id): id is string => Boolean(id)))];
    const actorMap = new Map<string, NotificationFeedItem["actor"]>();

    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", actorIds);

      (profiles ?? []).forEach((profile) => {
        actorMap.set(profile.id, profile as NotificationFeedItem["actor"]);
      });
    }

    const notifications: NotificationFeedItem[] = (data ?? []).map((item) => ({
      ...item,
      actor: item.actor_id ? actorMap.get(item.actor_id) ?? null : null,
    }));

    return { notifications, error: null };
  },

  /**
   * Creates a notification. Mirrors the website's socialhubNotify:
   * never notifies a user about their own action. Insert is allowed by
   * RLS because actor_id = the current (acting) user.
   */
  async create(input: NotificationCreateInput): Promise<{ error: string | null }> {
    if (!input.userId || !input.actorId || input.userId === input.actorId) {
      return { error: null };
    }
    const { error } = await supabase.from("notifications").insert({
      user_id: input.userId,
      actor_id: input.actorId,
      type: input.type || "general",
      post_id: input.postId ?? null,
      content: input.content ?? null,
    });
    return { error: toFriendly(error?.message ?? null, "Could not save the notification.") };
  },

  /**
   * Notifies the owner of a post (like / comment). Mirrors the
   * website's socialhubNotifyOwner. No self-notifications.
   */
  async notifyPostOwner(
    postId: string,
    actorId: string,
    type: "like" | "comment",
    content?: string | null
  ): Promise<void> {
    try {
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .maybeSingle();
      if (post?.user_id) {
        await this.create({
          userId: post.user_id,
          actorId,
          type,
          postId,
          content: content ?? null,
        });
      }
    } catch {
      // Notifications must never break the core like/comment flow.
    }
  },

  async markAllRead(): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);

    return { error: toFriendly(error?.message ?? null, "Could not update notifications.") };
  },

  async markRead(notificationId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    return { error: toFriendly(error?.message ?? null, "Could not update this notification.") };
  },

  /** Count of unread notifications (for badges). */
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);

    if (error) {
      return 0;
    }
    return count ?? 0;
  },

  /**
   * Centralized realtime subscription - exactly one per app.
   * The callback receives the fresh unread count after an INSERT.
   * Returns an unsubscribe function.
   */
  subscribe(onChange: (payload: { eventType: string; payload: AppNotification | null }) => void): () => void {
    const channel = supabase
      .channel("socialhub-mobile-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          onChange({
            eventType: payload.eventType,
            payload: (payload.new as AppNotification) ?? null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};