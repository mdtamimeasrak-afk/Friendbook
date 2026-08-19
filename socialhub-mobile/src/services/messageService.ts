import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";
import type { Message, Profile } from "@/types/database";

export interface Conversation {
  otherUser: Pick<Profile, "id" | "full_name" | "username" | "avatar_url"> & { last_seen: string | null };
  lastMessage: Message;
  unreadCount: number;
}

export interface ConversationsResult {
  conversations: Conversation[];
  error: string | null;
}

export interface ChatPageResult {
  messages: Message[];
  hasMore: boolean;
  error: string | null;
}

const MESSAGE_FIELDS = "id, sender_id, receiver_id, content, read, read_at, media_url, reply_to, created_at";

function toFriendly(message: string | null, fallback: string): string | null {
  return message ? toFriendlyError({ message }, fallback) : null;
}

function isRelatedToMe(message: Message, meId: string): boolean {
  return message.sender_id === meId || message.receiver_id === meId;
}

function isInConversation(message: Message, meId: string, otherId: string): boolean {
  return (
    (message.sender_id === meId && message.receiver_id === otherId) ||
    (message.sender_id === otherId && message.receiver_id === meId)
  );
}

/**
 * Message service - messages table.
 * RLS: only the sender and receiver can select a message; inserts require
 * auth.uid() = sender_id; updates allowed for both sides (read receipts);
 * deletes only for the sender. Realtime is enabled on the table, so
 * postgres_changes events respect these same RLS rules.
 * "Conversations" are derived from the sender/receiver pair (the schema
 * has no conversation table - matches the website exactly).
 */
export const messageService = {
  PAGE_SIZE: 40,

  async getConversations(meId: string): Promise<ConversationsResult> {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .or(`sender_id.eq.${meId},receiver_id.eq.${meId}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return { conversations: [], error: toFriendly(error.message, "Could not load your messages.") };
    }

    const map = new Map<string, { lastMessage: Message; unread: number }>();

    (messages ?? []).forEach((message) => {
      const otherId = message.sender_id === meId ? message.receiver_id : message.sender_id;
      if (!otherId) {
        return;
      }
      const existing = map.get(otherId);
      if (!existing) {
        map.set(otherId, {
          lastMessage: message,
          unread: message.sender_id !== meId && !message.read ? 1 : 0,
        });
      } else {
        existing.lastMessage = message;
        if (message.sender_id !== meId && !message.read) {
          existing.unread++;
        }
      }
    });

    const otherIds = [...map.keys()];
    const profileMap = new Map<string, Conversation["otherUser"]>();

    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, last_seen")
        .in("id", otherIds);

      (profiles ?? []).forEach((profile) => {
        profileMap.set(profile.id, profile as Conversation["otherUser"]);
      });
    }

    const conversations: Conversation[] = [...map.entries()]
      .map(([otherId, value]) => ({
        otherUser:
          profileMap.get(otherId) ??
          ({ id: otherId, full_name: null, username: null, avatar_url: null, last_seen: null } as Conversation["otherUser"]),
        lastMessage: value.lastMessage,
        unreadCount: value.unread,
      }))
      .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());

    return { conversations, error: null };
  },

  /**
   * First chat batch: the newest messages (ascending order for the
   * FlatList). limit = PAGE_SIZE.
   */
  async getChatPage(meId: string, otherId: string, limit = 40): Promise<ChatPageResult> {
    const { data, error } = await supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .or(
        `and(sender_id.eq.${meId},receiver_id.eq.${otherId}),` +
          `and(sender_id.eq.${otherId},receiver_id.eq.${meId})`
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { messages: [], hasMore: false, error: toFriendly(error.message, "Could not load messages.") };
    }

    const rows = (data ?? []) as Message[];
    const hasMore = rows.length === limit;
    const messages = hasMore ? rows.slice(0, limit - 1) : rows;
    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { messages, hasMore, error: null };
  },

  /** Older messages before the given created_at cursor (ascending). */
  async getOlderMessages(
    meId: string,
    otherId: string,
    beforeCreatedAt: string,
    limit = 40
  ): Promise<ChatPageResult> {
    const { data, error } = await supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .or(
        `and(sender_id.eq.${meId},receiver_id.eq.${otherId}),` +
          `and(sender_id.eq.${otherId},receiver_id.eq.${meId})`
      )
      .lt("created_at", beforeCreatedAt)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { messages: [], hasMore: false, error: toFriendly(error.message, "Could not load older messages.") };
    }

    const rows = (data ?? []) as Message[];
    const hasMore = rows.length === limit;
    const messages = hasMore ? rows.slice(0, limit - 1) : rows;
    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { messages, hasMore, error: null };
  },

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    mediaUrl?: string | null,
    replyTo?: string | null
  ): Promise<{ message: Message | null; error: string | null }> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        media_url: mediaUrl ?? null,
        reply_to: replyTo ?? null,
      })
      .select(MESSAGE_FIELDS)
      .maybeSingle();

    if (error) {
      return { message: null, error: toFriendly(error.message, "Could not send your message.") };
    }
    return { message: (data as Message) ?? null, error: null };
  },

  async deleteMessage(messageId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    return { error: toFriendly(error?.message ?? null, "Could not delete this message.") };
  },

  async getMessage(messageId: string): Promise<{ message: Message | null; error: string | null }> {
    const { data, error } = await supabase.from("messages").select(MESSAGE_FIELDS).eq("id", messageId).maybeSingle();
    if (error) {
      return { message: null, error: toFriendly(error.message, "Could not load this message.") };
    }
    return { message: (data as Message) ?? null, error: null };
  },

  async markConversationRead(meId: string, otherId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("messages")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("sender_id", otherId)
      .eq("receiver_id", meId)
      .eq("read", false);

    return { error: toFriendly(error?.message ?? null, "Could not update read state.") };
  },

  /** Count of unread incoming messages (for badges). */
  async getUnreadCount(meId: string): Promise<number> {
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", meId)
      .eq("read", false);

    if (error) {
      return 0;
    }
    return count ?? 0;
  },

  /**
   * Uploads a chat image to the chat-images bucket (public-read, like the
   * website). Returns the public URL. Mirrors the website's 5MB rule.
   */
  async uploadChatImage(uri: string, meId: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      if (blob.size > 5 * 1024 * 1024) {
        return { url: null, error: "Image is too big. Maximum size is 5MB." };
      }

      const extMatch = /\.([a-zA-Z0-9]+)(\?|$)/.exec(uri);
      const ext = extMatch ? extMatch[1].toLowerCase() : "jpg";
      const path = `${meId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("chat-images").upload(path, blob, {
        upsert: true,
        contentType: blob.type || "image/jpeg",
      });

      if (uploadError) {
        return { url: null, error: toFriendly(uploadError.message, "Could not upload the image.") };
      }

      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      return { url: urlData.publicUrl, error: null };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not upload the image.";
      return { url: null, error: toFriendlyError({ message }, "Could not upload the image.") };
    }
  },

  /**
   * Conversation-scoped realtime subscription (INSERT + UPDATE).
   * RLS restricts postgres_changes to the user's own messages; we
   * additionally filter to this conversation and by message id for
   * deduplication.
   */
  subscribeConversation(
    meId: string,
    otherId: string,
    onChange: (event: { eventType: string; message: Message }) => void
  ): () => void {
    const channel = supabase
      .channel(`socialhub-chat-${meId}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as Message;
          if (isInConversation(message, meId, otherId)) {
            onChange({ eventType: "INSERT", message });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as Message;
          if (isInConversation(message, meId, otherId)) {
            onChange({ eventType: "UPDATE", message });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /** Global messages subscription - refreshes the unread badge (session-level). */
  subscribeNewMessages(meId: string, onChange: (message: Message) => void): () => void {
    const channel = supabase
      .channel("socialhub-mobile-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as Message;
          if (isRelatedToMe(message, meId)) {
            onChange(message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};