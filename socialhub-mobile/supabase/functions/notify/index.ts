// SocialHub push notification Edge Function (Step 7).
//
// The Android app NEVER sends pushes and never holds FCM/Expo
// credentials. This function is the only push sender: it reads the
// recipient's device tokens with the service role and forwards them
// to the Expo Push API (which routes to FCM on Android).
//
// Deploy (Supabase CLI, from this repo root):
//   supabase functions deploy notify --project-ref <ref>
// Secrets (Supabase dashboard -> Edge Functions -> Secrets):
//   SUPABASE_SERVICE_ROLE_KEY  (service role key - server only)
//   EXPO_ACCESS_TOKEN         (optional, Expo Push API token)
//
// Usage (POST, JSON):
//   { "userId": "...", "title": "...", "body": "...",
//     "channelId": "socialhub-messages",
//     "data": { "type": "message", "url": "socialhub://messages/<id>", "fromId": "..." } }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN") ?? "";
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendToExpo(messages: Array<Record<string, unknown>>): Promise<{ ok: number; failed: string[] }> {
  const results: string[] = [];
  let ok = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(batch),
    });
    const payload = (await response.json()) as { data?: Array<{ status?: string; message?: string }> };
    const items = payload.data ?? [];
    items.forEach((item, index) => {
      if (item.status === "ok") {
        ok += 1;
      } else {
        results.push(`${item.status ?? "error"}: ${item.message ?? `ticket ${index}`}`);
      }
    });
  }
  return { ok, failed: results };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Verify the caller: must be a real authenticated user, and they may
  // only trigger pushes for themselves or as the actor (fromId) of the
  // event. This keeps the function from being an open spam relay.
  const authHeader = request.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: caller, error: authError } = await userClient.auth.getUser();
  if (authError || !caller.user) {
    return json({ error: "Unauthorized" }, 401);
  }

  let input: {
    userId?: string;
    title?: string;
    body?: string;
    channelId?: string;
    data?: Record<string, unknown>;
  };
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const recipientId = input.userId;
  const fromId = typeof input.data?.fromId === "string" ? input.data.fromId : undefined;
  if (!recipientId) {
    return json({ error: "userId is required" }, 400);
  }
  if (caller.user.id !== recipientId && fromId !== caller.user.id) {
    return json({ error: "Forbidden: you can only push to yourself or as the event actor" }, 403);
  }

  // Recipient's registered devices (service role - bypasses RLS, never
  // exposed to clients).
  const { data: tokens, error: tokensError } = await serviceClient
    .from("device_tokens")
    .select("device_token")
    .eq("user_id", recipientId);

  if (tokensError) {
    return json({ error: "Could not read device tokens" }, 500);
  }
  if (!tokens || tokens.length === 0) {
    return json({ ok: true, sent: 0, failed: [], note: "no registered devices" });
  }

  const title = input.title ?? "SocialHub";
  const body = input.body ?? "You have a new update on SocialHub";
  const channelId = input.channelId ?? "socialhub-activity";
  const messages = tokens.map((row) => ({
    to: row.device_token,
    title,
    body,
    channelId,
    sound: "default",
    priority: "high" as const,
    data: input.data ?? {},
  }));

  const { ok, failed } = await sendToExpo(messages);
  return json({ ok: true, sent: ok, failed });
});