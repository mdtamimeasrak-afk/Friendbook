import { supabase } from "@/lib/supabase";

export interface TypingPayload {
  from: string;
  to: string;
}

const TYPING_CHANNEL = "socialhub-typing-live";
const PRESENCE_CHANNEL = "socialhub-online-live";
const TYPING_SEND_THROTTLE_MS = 900;
const TYPING_VISIBLE_MS = 1800;
const HEARTBEAT_MS = 30000;

let lastTypingSentAt = 0;
let typingChannel: ReturnType<typeof supabase.channel> | null = null;

/**
 * Presence service - online/offline + typing indicators.
 * No database writes per keystroke: typing uses Realtime broadcast
 * channels, online state uses Realtime presence + a throttled
 * profiles.last_seen heartbeat (mirrors the website's architecture).
 */
export const presenceService = {
  /**
   * Subscribes to the app-wide presence channel and reports the set
   * of currently-online user ids. Returns an unsubscribe function.
   */
  subscribePresence(meId: string, onChange: (onlineIds: Set<string>) => void): () => void {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const refresh = () => {
      if (!channel) {
        return;
      }
      const state = channel.presenceState();
      const ids = new Set<string>();
      Object.values(state).forEach((list) => {
        list.forEach((item) => {
          const userId = (item as { user_id?: string }).user_id;
          if (userId) {
            ids.add(userId);
          }
        });
      });
      onChange(ids);
    };

    channel = supabase
      .channel(PRESENCE_CHANNEL)
      .on("presence", { event: "sync" }, refresh)
      .on("presence", { event: "join" }, refresh)
      .on("presence", { event: "leave" }, refresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel?.track({ user_id: meId });
        }
      });

    return () => {
      channel?.untrack();
      supabase.removeChannel(channel);
    };
  },

  /** Throttled profiles.last_seen update (FB-style "last active" fallback). */
  async heartbeat(meId: string): Promise<void> {
    try {
      await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", meId);
    } catch {
      // Column missing or offline - presence channel is the primary signal.
    }
  },

  /**
   * Shared typing channel (created once, stays subscribed for the
   * app lifetime). Broadcasts need a subscribed channel, so send and
   * listen use the same instance.
   */
  typingChannel(): ReturnType<typeof supabase.channel> {
    if (!typingChannel) {
      typingChannel = supabase.channel(TYPING_CHANNEL).subscribe();
    }
    return typingChannel;
  },

  /** Sends a typing broadcast (throttled to ~1 per second). */
  sendTyping(meId: string, otherId: string): void {
    const now = Date.now();
    if (now - lastTypingSentAt < TYPING_SEND_THROTTLE_MS) {
      return;
    }
    lastTypingSentAt = now;
    this.typingChannel()
      .send({
        type: "broadcast",
        event: "typing",
        payload: { from: meId, to: otherId } satisfies TypingPayload,
      })
      .catch(() => {
        // Typing is best-effort - never blocks the composer.
      });
  },

  /**
   * Listens for typing broadcasts aimed at me from a specific person.
   * Calls the callback each time they type; the UI clears it after
   * TYPING_VISIBLE_MS (matches the website's 1800ms timeout).
   * Returns an unsubscribe function.
   */
  subscribeTyping(meId: string, otherId: string, onTyping: () => void): () => void {
    const channel = this.typingChannel();

    const listener = channel.on("broadcast", { event: "typing" }, (event) => {
      const payload = event.payload as TypingPayload | undefined;
      if (payload && payload.to === meId && payload.from === otherId) {
        onTyping();
      }
    });

    return () => {
      listener.unsubscribe();
    };
  },

  /** How long the "is typing..." label stays visible. */
  TYPING_VISIBLE_MS,
  HEARTBEAT_MS,
};