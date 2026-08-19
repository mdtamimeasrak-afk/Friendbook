/**
 * App-wide constants shared across screens and services.
 */

export const APP_NAME = "SocialHub";

export const APP_VERSION = "1.0.0";

export const ANDROID_PACKAGE = "com.socialhub.app";

/** Same audience values the website uses for post privacy. */
export const POST_AUDIENCES = [
  { key: "public", label: "Public" },
  { key: "friends", label: "Friends" },
  { key: "friends_of_friends", label: "Friends of Friends" },
  { key: "only_me", label: "Only me" },
] as const;

/** Stories expire 24h after creation (matches the database default). */
export const STORY_TTL_HOURS = 24;

/** Conversation list fetch limit. */
export const MESSAGE_FETCH_LIMIT = 200;

/** Max length of a post (matches website validation). */
export const POST_MAX_LENGTH = 5000;
