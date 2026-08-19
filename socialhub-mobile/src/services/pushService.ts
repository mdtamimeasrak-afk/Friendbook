import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { routeLink } from "@/lib/deep-link";
import { getStorageItem, setStorageItem } from "@/lib/storage";

const PERMISSION_ASKED_KEY = "socialhubNotifPermissionAsked";
const PLATFORM = "android";

export const PUSH_CHANNELS = {
  messages: "socialhub-messages",
  friendRequests: "socialhub-friend-requests",
  activity: "socialhub-activity",
  stories: "socialhub-stories",
} as const;

/** Which chat the user is currently looking at (foreground suppression). */
let activeChatUserId: string | null = null;
let registeredUserId: string | null = null;

/**
 * Push notification service (Step 7).
 *
 * The app ONLY registers an Expo push token in device_tokens.
 * Sending happens server-side in the Supabase Edge Function
 * (supabase/functions/notify) - FCM/Expo credentials never
 * exist inside the Android app.
 */
export const pushService = {
  /** Foreground behavior: show banners, but not for the open chat. */
  installHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as Record<string, unknown> | undefined;
        const isActiveChat = data?.type === "message" && data.fromId === activeChatUserId;
        return {
          shouldShowBanner: !isActiveChat,
          shouldShowList: !isActiveChat,
          shouldPlaySound: !isActiveChat,
          shouldSetBadge: false,
        };
      },
    });
  },

  /** Android notification channels (importance is type-appropriate). */
  async setupChannels(): Promise<void> {
    if (Platform.OS !== "android") {
      return;
    }
    const channel = (name: string, importance: Notifications.AndroidImportance, sound?: string) =>
      Notifications.setNotificationChannelAsync(name, {
        name,
        importance,
        vibrationPattern: importance === Notifications.AndroidImportance.HIGH ? [0, 250, 250, 250] : undefined,
        lightColor: "#6366F1",
        ...(sound ? { sound } : {}),
      });

    await Promise.all([
      channel(PUSH_CHANNELS.messages, Notifications.AndroidImportance.HIGH),
      channel(PUSH_CHANNELS.friendRequests, Notifications.AndroidImportance.HIGH),
      channel(PUSH_CHANNELS.activity, Notifications.AndroidImportance.DEFAULT),
      channel(PUSH_CHANNELS.stories, Notifications.AndroidImportance.DEFAULT),
    ]);
  },

  /** True if the user already granted notification permission. */
  async hasPermission(): Promise<boolean> {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted === true;
  },

  /**
   * Asks for notification permission - only once per install, only
   * when called by the UI at a meaningful moment (never at launch).
   */
  async requestPermissionIfNeeded(): Promise<boolean> {
    const asked = await getStorageItem(PERMISSION_ASKED_KEY);
    if (asked === "1") {
      return this.hasPermission();
    }
    await setStorageItem(PERMISSION_ASKED_KEY, "1");
    const settings = await Notifications.requestPermissionsAsync();
    return settings.granted === true;
  },

  /** Registers the current device token for the signed-in user. */
  async registerToken(userId: string): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }
    const granted = await this.hasPermission();
    if (!granted) {
      return false;
    }
    await this.setupChannels();

    let token: string;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error("EAS projectId not configured - push needs a development/production build.");
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
      logger.logError("push-token", error);
      return false;
    }
    if (!token) {
      return false;
    }

    registeredUserId = userId;

    // Owner-only RLS: read my rows, remove stale tokens, insert the
    // current one (insert-only upsert - the schema has no update policy).
    const { data: existing } = await supabase
      .from("device_tokens")
      .select("device_token")
      .eq("user_id", userId);
    if (existing?.some((row) => row.device_token === token)) {
      return true;
    }
    await supabase
      .from("device_tokens")
      .delete()
      .eq("user_id", userId)
      .neq("device_token", token);
    const { error } = await supabase
      .from("device_tokens")
      .upsert(
        { user_id: userId, device_token: token, platform: PLATFORM },
        { onConflict: "user_id,device_token", ignoreDuplicates: true }
      );
    if (error) {
      logger.logError("push-register", error);
      return false;
    }
    return true;
  },

  /** Removes all device tokens for the user (logout). */
  async unregisterToken(userId: string): Promise<void> {
    registeredUserId = null;
    await supabase.from("device_tokens").delete().eq("user_id", userId);
  },

  /** Keeps a rolled-over token in sync (rare). */
  watchTokenChanges(): () => void {
    const subscription = Notifications.addPushTokenListener(async (tokenData) => {
      if (registeredUserId && tokenData.type === Platform.OS) {
        await this.registerToken(registeredUserId);
      }
    });
    return () => subscription.remove();
  },

  /** Tells the handler which chat is open so messages there stay silent. */
  setActiveChatUserId(userId: string | null): void {
    activeChatUserId = userId;
  },

  /**
   * Routes notification taps through the central deep-link system.
   * Returns the unsubscribe function (call once from the root layout).
   */
  handleNotificationResponses(isSignedIn: () => boolean): () => void {
    const redirect = (url: unknown) => {
      if (typeof url === "string") {
        routeLink(url, isSignedIn());
      }
    };

    // App launched from a notification (cold start). Sync API in SDK 57.
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      redirect(lastResponse.notification.request.content.data?.url);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification.request.content.data?.url);
    });

    return () => subscription.remove();
  },
};