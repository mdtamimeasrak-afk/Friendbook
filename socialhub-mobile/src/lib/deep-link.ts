import { router } from "expo-router";

import { getStorageItem, removeStorageItem, setStorageItem } from "@/lib/storage";

const PENDING_LINK_KEY = "socialhubPendingLink";

export type DeepLinkTarget =
  | { type: "profile"; id: string }
  | { type: "post"; id: string }
  | { type: "story"; id: string }
  | { type: "messages"; id: string };

/**
 * Central deep-link system (Step 7):
 *   socialhub://profile/<userId>    -> /profile/[id]
 *   socialhub://post/<postId>       -> /post/[id]
 *   socialhub://story/<userId>      -> /story/[id]
 *   socialhub://messages/<userId>   -> /messages/[id]
 *
 * When the user is signed in, expo-router handles the URL natively;
 * this module is used for notification taps and for remembering a
 * destination when the user isn't signed in yet (cold-start flow).
 */

export function parseDeepLink(url: string): DeepLinkTarget | null {
  if (!url) {
    return null;
  }
  // Accept both socialhub://profile/x and socialhub:///profile/x
  const match = url.match(/^socialhub:\/{2,3}([^/?]+)\/([^/?]+)/);
  if (!match) {
    return null;
  }
  const segment = match[1];
  const id = decodeURIComponent(match[2]);
  if (!id) {
    return null;
  }
  switch (segment) {
    case "profile":
      return { type: "profile", id };
    case "post":
      return { type: "post", id };
    case "story":
      return { type: "story", id };
    case "messages":
      return { type: "messages", id };
    default:
      return null;
  }
}

const ROUTES: Record<DeepLinkTarget["type"], { pathname: "/profile/[id]" | "/post/[id]" | "/story/[id]" | "/messages/[id]"; params: { id: string } }> = {
  profile: { pathname: "/profile/[id]", params: { id: "" } },
  post: { pathname: "/post/[id]", params: { id: "" } },
  story: { pathname: "/story/[id]", params: { id: "" } },
  messages: { pathname: "/messages/[id]", params: { id: "" } },
};

export function targetToRoute(target: DeepLinkTarget): { pathname: "/profile/[id]" | "/post/[id]" | "/story/[id]" | "/messages/[id]"; params: { id: string } } {
  return { pathname: ROUTES[target.type].pathname, params: { id: target.id } };
}

/** Navigates to a deep link target (signed-in path). */
export function navigateToTarget(target: DeepLinkTarget): void {
  router.push(targetToRoute(target));
}

export async function savePendingLink(url: string): Promise<void> {
  await setStorageItem(PENDING_LINK_KEY, url);
}

export async function getPendingLink(): Promise<string | null> {
  return getStorageItem(PENDING_LINK_KEY);
}

/**
 * Reads + clears the pending destination. Returns null when nothing
 * was stored. Called right after a successful sign-in so the user
 * lands where they originally tapped.
 */
export async function consumePendingLink(): Promise<DeepLinkTarget | null> {
  const url = await getStorageItem(PENDING_LINK_KEY);
  if (!url) {
    return null;
  }
  await removeStorageItem(PENDING_LINK_KEY);
  return parseDeepLink(url);
}

/**
 * Routes a deep link/notification URL through the central system:
 * signed-in -> navigate now; signed-out -> remember for after login.
 */
export async function routeLink(url: string, isSignedIn: boolean): Promise<void> {
  const target = parseDeepLink(url);
  if (!target) {
    return;
  }
  if (isSignedIn) {
    navigateToTarget(target);
  } else {
    await savePendingLink(url);
  }
}