import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";
import type { Profile } from "@/types/database";

export interface GetProfileResult {
  profile: Profile | null;
  error: string | null;
}

/**
 * Profile service - profiles table (id = auth.users.id).
 * RLS: everyone can read profiles; only the owner can update.
 */
export const profileService = {
  async getProfile(userId: string): Promise<GetProfileResult> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error: toFriendlyError(error, "Could not load this profile.") };
    }
    return { profile: data, error: null };
  },

  async getCurrentProfile(): Promise<GetProfileResult> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return { profile: null, error: "Not signed in." };
    }
    return this.getProfile(data.user.id);
  },

  async createProfile(userId: string, details: { full_name: string; username: string }): Promise<GetProfileResult> {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: details.full_name, username: details.username })
      .select("*")
      .maybeSingle();

    if (error) {
      return { profile: null, error: toFriendlyError(error, "Could not create your profile.") };
    }
    return { profile: data, error: null };
  },

  /** Creates the profile row if the trigger hasn't run yet (defensive). */
  async ensureProfile(userId: string, fullName: string, username: string): Promise<GetProfileResult> {
    const existing = await this.getProfile(userId);
    if (existing.profile && !existing.error) {
      return existing;
    }
    if (existing.error) {
      return existing;
    }
    return this.createProfile(userId, { full_name: fullName, username });
  },

  /**
   * Checks whether a username is already in use by another profile.
   * Mirrors the website (core/settings.js) which queries before saving;
   * the profiles table has no DB unique constraint on username.
   */
  async isUsernameTaken(username: string, excludeUserId?: string): Promise<{ taken: boolean; error: string | null }> {
    const clean = username.trim().toLowerCase();

    let query = supabase.from("profiles").select("id").eq("username", clean).limit(1);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      return { taken: false, error: toFriendlyError(error, "Could not check username availability.") };
    }
    return { taken: (data ?? []).length > 0, error: null };
  },

  async updateProfile(userId: string, updates: Partial<Pick<Profile, "full_name" | "username" | "bio" | "avatar_url" | "location" | "work" | "education" | "website" | "birthday" | "cover_url">>): Promise<GetProfileResult> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      return { profile: null, error: toFriendlyError(error, "Could not save your profile.") };
    }
    return { profile: data, error: null };
  },
};
