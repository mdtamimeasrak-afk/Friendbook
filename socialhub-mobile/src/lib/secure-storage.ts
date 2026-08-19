import * as SecureStore from "expo-secure-store";

/**
 * Secure storage adapter for the Supabase auth session.
 * Uses Android EncryptedSharedPreferences / iOS Keychain via
 * expo-secure-store - never AsyncStorage (which is unencrypted).
 * Passwords, tokens and secrets must never be written anywhere else.
 */
export const secureStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      // Storage is best-effort: never crash the app because a
      // keychain write failed. The session simply won't persist.
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Best-effort cleanup.
    }
  },
};