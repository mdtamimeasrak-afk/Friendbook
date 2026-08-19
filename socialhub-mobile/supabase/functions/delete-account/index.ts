// SocialHub account deletion Edge Function (Step 8).
//
// Google Play requires a real account-deletion mechanism. Deleting an
// auth user requires the service role, so it can never run from the
// client directly. This function deletes the CALLER'S OWN account:
// the auth user is removed, and every data table cascades through
// profiles (profiles.id references auth.users ON DELETE CASCADE and
// all content references profiles.id ON DELETE CASCADE), so posts,
// likes, comments, stories, friendships, messages, notifications and
// device tokens are removed with it.
//
// Deploy (Supabase CLI, from the mobile repo root):
//   supabase functions deploy delete-account --project-ref <ref>
// Secrets (Supabase dashboard -> Edge Functions -> Secrets):
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Verify the caller - the function operates on the caller's own JWT,
  // so a user can only ever delete their own account.
  const authHeader = request.headers.get("Authorization") ?? "";
  const caller = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await caller.auth.getUser();
  if (authError || !userData.user) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return json({ error: "Could not delete the account", detail: deleteError.message }, 500);
  }

  return json({ ok: true, deletedUserId: userId });
});