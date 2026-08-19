import { supabase } from "@/lib/supabase";
import { removeStorageItem, storageKeys } from "@/lib/storage";

export interface SignUpResult {
  userCreated: boolean;
  sessionStarted: boolean;
  requiresEmailConfirmation: boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
}

const NETWORK_PATTERNS = [
  /failed to fetch/i,
  /network request failed/i,
  /fetch failed/i,
  /network error/i,
  /timeout/i,
  /connection/i,
  /socket/i,
];

/**
 * Maps raw Supabase/network errors to friendly, human-readable messages.
 * The app must NEVER surface raw SDK errors to the user.
 */
export function toFriendlyError(error: { message?: string } | null | undefined, fallback: string): string {
  if (!error || !error.message) {
    return fallback;
  }

  const message = error.message;

  for (const pattern of NETWORK_PATTERNS) {
    if (pattern.test(message)) {
      return "No internet connection. Check your connection and try again.";
    }
  }

  const map: Array<[RegExp, string]> = [
    [/invalid login credentials/i, "Incorrect email or password. Please try again."],
    [/email not confirmed/i, "Please confirm your email first. Check your inbox for the confirmation link."],
    [/user already registered/i, "An account with this email already exists. Try logging in instead."],
    [/password should be at least/i, "Password must be at least 6 characters long."],
    [/signups not allowed/i, "New signups are currently disabled. Please try again later."],
    [/unable to validate email/i, "That email address looks invalid. Check it and try again."],
    [/too many requests|rate limit/i, "Too many attempts. Please wait a moment and try again."],
    [/token has expired|refresh token not found|invalid jwt/i, "Your session expired. Please log in again."],
    [/email address is invalid/i, "That email address looks invalid. Check it and try again."],
    [/cannot be empty/i, "Please fill in all the required fields."],
    [/is required/i, "Please fill in all the required fields."],
  ];

  for (const [pattern, friendly] of map) {
    if (pattern.test(message)) {
      return friendly;
    }
  }

  return fallback;
}

/**
 * Auth service - wraps the existing SocialHub Supabase auth.
 * Same behavior as the website (core/script.js):
 * - signup auto-creates the profile (trigger handle_new_user) and stores
 *   name/username for the first login when email confirmation is ON.
 * - login reactivates deactivated accounts.
 */
export const authService = {
  async getCurrentSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },

  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },

  async refreshSession(): Promise<boolean> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      return false;
    }
    return Boolean(data.session);
  },

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: toFriendlyError(error, "Login failed. Please try again.") };
    }
    if (!data.session) {
      return { error: "Login failed. Please try again." };
    }

    // Reactivate account on login (same as website)
    try {
      await supabase
        .from("profiles")
        .update({ deactivated: false })
        .eq("id", data.user.id);
    } catch {
      // ignore - reactivation is best-effort
    }

    await this.applyPendingProfile(data.user.id);

    return { error: null };
  },

  async signUp(input: SignUpInput): Promise<{ error: string | null; result?: SignUpResult }> {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
    });

    if (error) {
      return { error: toFriendlyError(error, "Account could not be created.") };
    }
    if (!data.user) {
      return { error: "Account could not be created." };
    }

    const username = input.fullName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._]/g, "");

    // Email confirmation ON -> no session yet, so keep the profile
    // details for the first login (RLS blocks writes before confirm).
    if (!data.session) {
      await this.savePendingProfile(data.user.id, username, input.fullName.trim());
      return {
        error: null,
        result: {
          userCreated: true,
          sessionStarted: false,
          requiresEmailConfirmation: true,
        },
      };
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      username,
      full_name: input.fullName.trim(),
    });

    if (profileError) {
      return { error: `Account created, but profile could not be saved. ${toFriendlyError(profileError, "Please try again.")}` };
    }

    return {
      error: null,
      result: {
        userCreated: true,
        sessionStarted: true,
        requiresEmailConfirmation: false,
      },
    };
  },

  /**
   * Sends a password reset email via Supabase. The link opens the
   * Supabase-hosted change-password page (redirectTo = the live site),
   * matching the existing website setup which has no custom reset flow.
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "https://friendbook-78z.pages.dev/auth/",
    });

    if (error) {
      return { error: toFriendlyError(error, "Could not send the reset email. Please try again.") };
    }

    return { error: null };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async savePendingProfile(id: string, username: string, fullName: string): Promise<void> {
    const { setStorageJson } = await import("@/lib/storage");
    await setStorageJson(storageKeys.pendingProfile, { id, username, full_name: fullName });
  },

  /** Applies the stored pending profile on first login after email confirmation. */
  async applyPendingProfile(userId: string): Promise<void> {
    const { getStorageJson, removeStorageItem } = await import("@/lib/storage");
    const pending = await getStorageJson<{ id: string; username: string; full_name: string }>(
      storageKeys.pendingProfile
    );
    if (!pending || pending.id !== userId) {
      return;
    }
    try {
      await supabase.from("profiles").upsert({
        id: pending.id,
        username: pending.username,
        full_name: pending.full_name,
      });
    } finally {
      await removeStorageItem(storageKeys.pendingProfile);
    }
  },
};
