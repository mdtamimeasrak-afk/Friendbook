import { supabase } from "@/lib/supabase";
import { toFriendlyError } from "@/services/authService";

/**
 * Account deletion service (Step 8).
 *
 * Deleting an auth user requires the service role, so the client
 * asks the server-side Edge Function (supabase/functions/delete-account)
 * which verifies the caller's JWT and deletes ONLY the caller's own
 * account. All user data cascades away via profiles.
 */
export const accountService = {
  async deleteAccount(): Promise<{ error: string | null }> {
    const { data, error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
    });
    if (error) {
      return {
        error: toFriendlyError(error, "Couldn't delete your account. Please check your connection and try again."),
      };
    }
    const result = data as { ok?: boolean } | null;
    if (!result?.ok) {
      return { error: "Couldn't delete your account. Please try again." };
    }
    return { error: null };
  },
};