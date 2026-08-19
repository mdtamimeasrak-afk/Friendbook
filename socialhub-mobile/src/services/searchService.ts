import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";
import { friendService, type FriendStatus } from "@/services/friendService";
import { getStorageJson, setStorageJson } from "@/lib/storage";
import type { Profile } from "@/types/database";

export interface SearchPerson extends Profile {
  friendStatus: FriendStatus;
  mutualCount: number;
}

export interface SearchResult {
  people: SearchPerson[];
  hasMore: boolean;
  error: string | null;
}

const PROFILE_FIELDS = "id, full_name, username, avatar_url, created_at";
const RECENT_KEY_PREFIX = "socialhubRecentSearches";
const MAX_RECENT = 8;

function cleanQuery(value: string): string {
  return value.replace(/[%_,]/g, "").trim();
}

function toFriendly(message: string | null, fallback: string): string | null {
  return message ? toFriendlyError({ message }, fallback) : null;
}

/**
 * Search service - people search against the profiles table.
 * RLS: profiles are publicly readable (select true); we still filter
 * out deactivated accounts and blocked users client-side, and never
 * fetch the whole table (bounded page + ilike).
 */
export const searchService = {
  PAGE_SIZE: 20,

  /**
   * Searches people by display name or username (partial, case-insensitive).
   * Paginated: fetches pageSize+1 rows to compute hasMore.
   */
  async searchPeople(query: string, meId: string, page = 0, pageSize = 20): Promise<SearchResult> {
    const clean = cleanQuery(query);
    if (clean === "" || !meId) {
      return { people: [], hasMore: false, error: null };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .or(`full_name.ilike.%${clean}%,username.ilike.%${clean}%`)
      .neq("id", meId)
      .range(page * pageSize, (page + 1) * pageSize);

    if (error) {
      return { people: [], hasMore: false, error: toFriendlyError(error, "Couldn't complete your search.") };
    }

    const rows = (data ?? []) as Profile[];
    const hasMore = rows.length > pageSize;
    const pageRows = rows.slice(0, pageSize);

    // Exclude deactivated accounts (column exists from Phase 2 privacy).
    const { data: deactivated } = await supabase
      .from("profiles")
      .select("id")
      .in("id", pageRows.map((row) => row.id))
      .eq("deactivated", true);

    const hidden = new Set((deactivated ?? []).map((row) => row.id));
    const visible = pageRows.filter((row) => !hidden.has(row.id));

    // Exclude users I've blocked.
    const blocked = await friendService.getBlockedIds(meId);
    const candidates = visible.filter((row) => !blocked.has(row.id));

    const { people, error: statusError } = await this.attachStatuses(meId, candidates);
    return { people, hasMore, error: statusError };
  },

  /** Batch-attaches friend status + mutual counts to a list of people. */
  async attachStatuses(meId: string, people: Profile[]): Promise<{ people: SearchPerson[]; error: string | null }> {
    if (people.length === 0) {
      return { people: [], error: null };
    }

    const ids = people.map((person) => person.id);

    const { data: friendships, error } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(`requester_id.eq.${meId},addressee_id.eq.${meId}`)
      .in("requester_id", [...ids, meId])
      .in("addressee_id", [...ids, meId]);

    if (error) {
      return { people: [], error: toFriendlyError(error, "Couldn't complete your search.") };
    }

    const statusMap = new Map<string, FriendStatus>();
    (friendships ?? []).forEach((f) => {
      let other: string | null = null;
      if (f.requester_id === meId) {
        other = f.addressee_id;
      } else if (f.addressee_id === meId) {
        other = f.requester_id;
      }
      if (!other) {
        return;
      }
      if (f.status === "accepted") {
        statusMap.set(other, "accepted");
      } else if (!statusMap.has(other)) {
        statusMap.set(other, f.requester_id === meId ? "pending_outgoing" : "pending_incoming");
      }
    });

    const blocked = await friendService.getBlockedIds(meId);

    const withMutual = await Promise.all(
      people.map(async (person) => {
        const status = blocked.has(person.id) ? "blocked" : statusMap.get(person.id) ?? "none";
        const mutualCount = status === "none" ? await friendService.getMutualCount(meId, person.id) : 0;
        return { ...person, friendStatus: status, mutualCount } as SearchPerson;
      })
    );

    return { people: withMutual, error: null };
  },

  // ---- Recent searches (local, minimal, per-user) ----

  recentKey(meId: string): string {
    return `${RECENT_KEY_PREFIX}:${meId}`;
  },

  async getRecent(meId: string): Promise<SearchPerson[]> {
    const key = this.recentKey(meId);
    const stored = await getStorageJson<SearchPerson[]>(key);
    return Array.isArray(stored) ? stored : [];
  },

  async saveRecent(meId: string, person: Pick<Profile, "id" | "full_name" | "username" | "avatar_url">): Promise<void> {
    const key = this.recentKey(meId);
    const current = await this.getRecent(meId);
    const next = [
      {
        ...person,
        friendStatus: "none" as const,
        mutualCount: 0,
        created_at: new Date().toISOString(),
      } as SearchPerson,
      ...current.filter((item) => item.id !== person.id),
    ].slice(0, MAX_RECENT);
    await setStorageJson(key, next);
  },

  async removeRecent(meId: string, personId: string): Promise<void> {
    const key = this.recentKey(meId);
    const current = await this.getRecent(meId);
    await setStorageJson(key, current.filter((item) => item.id !== personId));
  },

  async clearRecent(meId: string): Promise<void> {
    const key = this.recentKey(meId);
    await setStorageJson(key, []);
  },
};