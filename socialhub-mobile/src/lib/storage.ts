import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Typed storage helpers for app preferences and pending profile data.
 * The Supabase auth session itself is persisted by the client via
 * AsyncStorage (see lib/supabase.ts).
 */

export const storageKeys = {
  theme: "socialhubTheme",
  pendingProfile: "socialhubPendingProfile",
  notifMuted: "socialhubNotifMuted",
} as const;

export async function getStorageItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // storage unavailable - ignore
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // storage unavailable - ignore
  }
}

export async function getStorageJson<T>(key: string): Promise<T | null> {
  const raw = await getStorageItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setStorageJson<T>(key: string, value: T): Promise<void> {
  await setStorageItem(key, JSON.stringify(value));
}
