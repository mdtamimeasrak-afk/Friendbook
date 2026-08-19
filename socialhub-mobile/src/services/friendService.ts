import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";
import { notificationService } from "@/services/notificationService";
import type { Friendship, Profile } from "@/types/database";

export interface FriendsResult {
  friends: Profile[];
  error: string | null;
}

export interface FriendRequestsResult {
  requests: Array<{ friendship: Friendship; profile: Profile }>;
  error: string | null;
}

export interface FriendSuggestion extends Profile {
  mutualCount: number;
  friendStatus?: FriendStatus;
}

export interface FriendSuggestionsResult {
  suggestions: FriendSuggestion[];
  error: string | null;
}

export type FriendStatus = "none" | "pending_outgoing" | "pending_incoming" | "accepted" | "blocked";

export interface FriendStatusResult {
  status: FriendStatus;
  error: string | null;
}

const PROFILE_FIELDS = "id, full_name, username, avatar_url, created_at, deactivated";

const MAX_FRIENDS_FOR_SUGGESTIONS = 60;

function toFriendly(message: string | null, fallback: string): string | null {
  return message ? toFriendlyError({ message }, fallback) : null;
}

/**
 * Friend service - friendships + blocks tables.
 * RLS: everyone can read friendships; only the requester inserts;
 * either side updates/deletes. Blocks are only visible to the blocker.
 * Flows mirror the website (core/friends.js) exactly.
 */
export const friendService = {
  async getFriends(userId: string): Promise<FriendsResult> {
    const { data, error } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) {
      return { friends: [], error: toFriendlyError(error, "Could not load friends.") };
    }

    const friendIds = (data ?? [])
      .map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id))
      .filter((id): id is string => Boolean(id));

    if (friendIds.length === 0) {
      return { friends: [], error: null };
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .in("id", friendIds);

    if (profileError) {
      return { friends: [], error: toFriendlyError(profileError, "Could not load friends.") };
    }
    return { friends: (profiles ?? []) as Profile[], error: null };
  },

  async getFriendCount(userId: string): Promise<{ count: number; error: string | null }> {
    const { count, error } = await supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) {
      return { count: 0, error: toFriendlyError(error, "Could not count friends.") };
    }
    return { count: count ?? 0, error: null };
  },

  /** Count of accepted friendships that connect me and another user. */
  async getMutualCount(meId: string, otherId: string): Promise<number> {
    try {
      const { data: myFriendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${meId},addressee_id.eq.${meId}`);

      const myFriendIds = (myFriendships ?? [])
        .map((row) => (row.requester_id === meId ? row.addressee_id : row.requester_id))
        .filter((id) => id !== meId);

      if (myFriendIds.length === 0) {
        return 0;
      }

      const { count, error } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${otherId},addressee_id.eq.${otherId}`)
        .in("requester_id", myFriendIds);

      const { count: count2 } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${otherId},addressee_id.eq.${otherId}`)
        .in("addressee_id", myFriendIds);

      if (error) {
        return 0;
      }
      return (count ?? 0) + (count2 ?? 0);
    } catch {
      return 0;
    }
  },

  async getIncomingRequests(userId: string): Promise<FriendRequestsResult> {
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .eq("addressee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return { requests: [], error: toFriendlyError(error, "Could not load friend requests.") };
    }

    const requesterIds = (data ?? []).map((row) => row.requester_id);
    const profileMap = new Map<string, Profile>();

    if (requesterIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select(PROFILE_FIELDS)
        .in("id", requesterIds);

      (profiles ?? []).forEach((profile) => {
        profileMap.set(profile.id, profile as Profile);
      });
    }

    const requests: FriendRequestsResult["requests"] = [];
    (data ?? []).forEach((friendship) => {
      const profile = profileMap.get(friendship.requester_id);
      if (profile) {
        requests.push({ friendship, profile });
      }
    });

    return { requests, error: null };
  },

  async getStatusWith(meId: string, otherId: string): Promise<FriendStatusResult> {
    if (meId === otherId) {
      return { status: "none", error: null };
    }

    const [friendshipResult, blockedResult] = await Promise.all([
      supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status")
        .or(
          `and(requester_id.eq.${meId},addressee_id.eq.${otherId}),` +
            `and(requester_id.eq.${otherId},addressee_id.eq.${meId})`
        )
        .maybeSingle(),
      supabase
        .from("blocks")
        .select("id")
        .eq("blocker_id", meId)
        .eq("user_id", otherId)
        .maybeSingle(),
    ]);

    if (blockedResult.data) {
      return { status: "blocked", error: null };
    }

    const data = friendshipResult.data;
    if (friendshipResult.error) {
      return { status: "none", error: toFriendlyError(friendshipResult.error, "Could not load friend status.") };
    }
    if (!data) {
      return { status: "none", error: null };
    }
    if (data.status === "accepted") {
      return { status: "accepted", error: null };
    }
    if (data.requester_id === meId) {
      return { status: "pending_outgoing", error: null };
    }
    return { status: "pending_incoming", error: null };
  },

  async sendRequest(requesterId: string, addresseeId: string): Promise<{ error: string | null }> {
    if (requesterId === addresseeId) {
      return { error: "You can't add yourself." };
    }
    const { error } = await supabase.from("friendships").insert({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error) {
      return { error: toFriendlyError(error, "Could not send the friend request.") };
    }
    // Notify the addressee (matches the website's socialhubNotify).
    await notificationService.create({
      userId: addresseeId,
      actorId: requesterId,
      type: "friend_request",
      postId: null,
      content: null,
    });
    return { error: null };
  },

  async cancelRequest(requesterId: string, addresseeId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("requester_id", requesterId)
      .eq("addressee_id", addresseeId);
    return { error: toFriendly(error?.message ?? null, "Could not cancel the request.") };
  },

  async acceptRequest(meId: string, requesterId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("requester_id", requesterId)
      .eq("addressee_id", meId);
    if (error) {
      return { error: toFriendlyError(error, "Could not accept the request.") };
    }
    // Notify the requester that they were accepted (website behavior).
    await notificationService.create({
      userId: requesterId,
      actorId: meId,
      type: "friend_accepted",
      postId: null,
      content: null,
    });
    return { error: null };
  },

  async declineRequest(meId: string, requesterId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("requester_id", requesterId)
      .eq("addressee_id", meId);
    return { error: toFriendly(error?.message ?? null, "Could not decline the request.") };
  },

  async respondToRequest(friendshipId: string, accept: boolean): Promise<{ error: string | null }> {
    if (accept) {
      const { data, error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId)
        .select("requester_id, addressee_id")
        .maybeSingle();
      if (error) {
        return { error: toFriendlyError(error, "Could not accept the request.") };
      }
      if (data) {
        const meId = (await supabase.auth.getUser()).data.user?.id;
        const requesterId = data.addressee_id === meId ? data.requester_id : data.addressee_id;
        if (meId && requesterId && requesterId !== meId) {
          await notificationService.create({
            userId: requesterId,
            actorId: meId,
            type: "friend_accepted",
            postId: null,
            content: null,
          });
        }
      }
      return { error: null };
    }
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    return { error: toFriendly(error?.message ?? null, "Could not decline the request.") };
  },

  async removeFriend(meId: string, otherId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(
        `and(requester_id.eq.${meId},addressee_id.eq.${otherId}),` +
          `and(requester_id.eq.${otherId},addressee_id.eq.${meId})`
      );
    return { error: toFriendly(error?.message ?? null, "Could not remove this friend.") };
  },

  /**
   * Friend suggestions via shared (mutual) friends - the only signal
   * the existing schema cleanly supports. Bounded queries, never loads
   * the whole user table, and excludes existing relationships,
   * blocked users and deactivated accounts.
   */
  async getSuggestions(meId: string, limit = 12): Promise<FriendSuggestionsResult> {
    try {
      const { data: myFriendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id, status")
        .or(`requester_id.eq.${meId},addressee_id.eq.${meId}`);

      const relatedIds = new Set<string>([meId]);
      (myFriendships ?? []).forEach((f) => {
        relatedIds.add(f.requester_id);
        relatedIds.add(f.addressee_id);
      });

      const myFriendIds = (myFriendships ?? [])
        .filter((f) => f.status === "accepted")
        .map((f) => (f.requester_id === meId ? f.addressee_id : f.requester_id))
        .filter((id) => id !== meId)
        .slice(0, MAX_FRIENDS_FOR_SUGGESTIONS);

      if (myFriendIds.length === 0) {
        return { suggestions: [], error: null };
      }

      const mutualCounts = new Map<string, number>();
      const candidateIds = new Set<string>();

      const [outgoing, incoming] = await Promise.all([
        supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .eq("status", "accepted")
          .in("requester_id", myFriendIds),
        supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .eq("status", "accepted")
          .in("addressee_id", myFriendIds),
      ]);

      const consider = (a: string, b: string) => {
        const other = a === meId ? b : b === meId ? a : null;
        if (!other) {
          return;
        }
        if (other === meId || relatedIds.has(other)) {
          return;
        }
        mutualCounts.set(other, (mutualCounts.get(other) ?? 0) + 1);
        candidateIds.add(other);
      };

      (outgoing.data ?? []).forEach((f) => consider(f.requester_id, f.addressee_id));
      (incoming.data ?? []).forEach((f) => consider(f.requester_id, f.addressee_id));

      if (candidateIds.size === 0) {
        return { suggestions: [], error: null };
      }

      // Exclude people I've blocked (blocks are only visible to me).
      const { data: myBlocks } = await supabase.from("blocks").select("user_id").eq("blocker_id", meId);
      const blockedIds = new Set((myBlocks ?? []).map((b) => b.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select(PROFILE_FIELDS)
        .in("id", [...candidateIds]);

      const suggestions: FriendSuggestion[] = (profiles ?? [])
        .filter((p) => !blockedIds.has(p.id) && !p.deactivated)
        .map((profile) => ({
          ...(profile as Profile),
          mutualCount: mutualCounts.get(profile.id) ?? 0,
        }))
        .sort((a, b) => b.mutualCount - a.mutualCount)
        .slice(0, limit);

      return { suggestions, error: null };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not load suggestions.";
      return { suggestions: [], error: toFriendlyError({ message }, "Could not load suggestions.") };
    }
  },

  // ---- Blocking (prepares the architecture for Step 7) ----

  async getBlockedIds(meId: string): Promise<Set<string>> {
    try {
      const { data } = await supabase.from("blocks").select("user_id").eq("blocker_id", meId);
      return new Set((data ?? []).map((row) => row.user_id));
    } catch {
      return new Set();
    }
  },

  async blockUser(meId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from("blocks").insert({
      blocker_id: meId,
      user_id: userId,
    });
    if (error) {
      return { error: toFriendlyError(error, "Could not block this user.") };
    }
    // Remove any existing friendship so blocked users are fully separated.
    await this.removeFriend(meId, userId);
    await this.removeFriend(userId, meId);
    return { error: null };
  },

  async unblockUser(meId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", meId)
      .eq("user_id", userId);
    return { error: toFriendly(error?.message ?? null, "Could not unblock this user.") };
  },
};