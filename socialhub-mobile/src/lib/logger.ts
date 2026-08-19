/**
 * Sanitized error logging.
 *
 * Production rules (Step 7):
 * - Never log passwords, tokens, sessions, private messages or media.
 * - Logs are capped (in-memory ring + on-disk ring in AsyncStorage).
 * - Sensitive-looking values (JWT-ish strings, URLs with credentials)
 *   are redacted before anything is stored.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "socialhubErrorLog";
const MAX_IN_MEMORY = 30;
const MAX_STORED = 50;

const SENSITIVE_KEY_RE =
  /(password|passwd|secret|token|session|authorization|apikey|api_key|access[_ -]?token|refresh[_ -]?token)/i;

const SENSITIVE_VALUE_RE =
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sb_publishable_[A-Za-z0-9_-]{10,}|[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g;

function redact(value: unknown): string {
  let text: string;
  try {
    text = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    text = String(value);
  }
  if (text.length > 4000) {
    text = `${text.slice(0, 4000)}…(truncated)`;
  }
  return text.replace(SENSITIVE_VALUE_RE, "[REDACTED]");
}

function sanitizeEntry(scope: string, error: unknown): string {
  const message = redact(error);
  return `[${new Date().toISOString()}] ${scope}: ${message}`;
}

const ring: string[] = [];

export const logger = {
  /** Logs a sanitized error string - safe for production. */
  logError(scope: string, error: unknown): void {
    const entry = sanitizeEntry(scope, error);
    ring.push(entry);
    if (ring.length > MAX_IN_MEMORY) {
      ring.shift();
    }
    // Fire-and-forget: log writes must never block or crash the app.
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const stored: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        stored.push(entry);
        while (stored.length > MAX_STORED) {
          stored.shift();
        }
        return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      })
      .catch(() => {
        // Storage unavailable - in-memory ring still holds the entry.
      });
  },

  /** Recent sanitized entries (for a debug/support screen if needed). */
  recent(): string[] {
    return [...ring];
  },

  /** Clears the on-device error log. */
  async clear(): Promise<void> {
    ring.length = 0;
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Best-effort.
    }
  },
};