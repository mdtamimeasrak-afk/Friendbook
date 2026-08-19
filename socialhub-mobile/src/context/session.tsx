import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { authService } from "@/services/authService";
import { friendService } from "@/services/friendService";
import { messageService } from "@/services/messageService";
import { notificationService, type NotificationFeedItem } from "@/services/notificationService";
import { presenceService } from "@/services/presenceService";
import { profileService } from "@/services/profileService";
import type { Profile } from "@/types/database";

interface SessionContextValue {
  isLoading: boolean;
  session: Session | null;
  user: Session["user"] | null;
  profile: Profile | null;
  notifications: NotificationFeedItem[];
  unreadNotifications: number;
  unreadFriendRequests: number;
  unreadMessages: number;
  onlineUserIds: Set<string>;
  messagesVersion: number;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<{ error: string | null; requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUnreadCounts: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationFeedItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadFriendRequests, setUnreadFriendRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [messagesVersion, setMessagesVersion] = useState(0);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshNotifications = useCallback(async () => {
    const { notifications: next } = await notificationService.getFeed(0, 30);
    setNotifications(next);
  }, []);

  const refreshUnreadCounts = useCallback(async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setUnreadNotifications(0);
      setUnreadFriendRequests(0);
      setUnreadMessages(0);
      return;
    }
    const [notifCount, messageCount, requestsResult] = await Promise.all([
      notificationService.getUnreadCount(),
      messageService.getUnreadCount(userId),
      friendService.getIncomingRequests(userId),
    ]);
    setUnreadNotifications(notifCount);
    setUnreadMessages(messageCount);
    setUnreadFriendRequests(requestsResult.requests.length);
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    const { profile: nextProfile } = await profileService.getProfile(userId);
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setUnreadNotifications(0);
        setUnreadMessages(0);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      return;
    }
    refreshProfile();
    refreshUnreadCounts();
    refreshNotifications();
  }, [session?.user?.id, refreshProfile, refreshUnreadCounts, refreshNotifications]);

  // Centralized realtime notification subscription - created once when
  // signed in and removed on sign-out (no per-screen subscriptions).
  useEffect(() => {
    if (!session?.user) {
      return;
    }
    const unsubscribe = notificationService.subscribe(() => {
      refreshUnreadCounts();
      refreshNotifications();
    });
    return () => unsubscribe();
  }, [session?.user?.id, refreshUnreadCounts, refreshNotifications]);

  // Centralized messaging + presence subscriptions (one per app):
  // new messages refresh the badge + bump messagesVersion so the
  // conversations screen can refetch; presence tracks online users.
  useEffect(() => {
    if (!session?.user) {
      return;
    }
    const meId = session.user.id;

    const unsubscribeMessages = messageService.subscribeNewMessages(meId, () => {
      refreshUnreadCounts();
      setMessagesVersion((previous) => previous + 1);
    });

    const unsubscribePresence = presenceService.subscribePresence(meId, setOnlineUserIds);

    presenceService.heartbeat(meId);
    heartbeatTimer.current = setInterval(() => {
      presenceService.heartbeat(meId);
    }, presenceService.HEARTBEAT_MS);

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        presenceService.heartbeat(meId);
        refreshUnreadCounts();
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribePresence();
      setOnlineUserIds(new Set());
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = null;
      }
      appStateSubscription.remove();
    };
  }, [session?.user?.id, refreshUnreadCounts]);

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      setNotifications((previous) =>
        previous.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
      );
      await notificationService.markRead(notificationId);
      setUnreadNotifications((previous) => Math.max(0, previous - 1));
    },
    []
  );

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
    setUnreadNotifications(0);
    await notificationService.markAllRead();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await authService.signIn(email, password);
    if (error) {
      return error;
    }
    await refreshProfile();
    await refreshUnreadCounts();
    await refreshNotifications();
    return null;
  }, [refreshProfile, refreshUnreadCounts, refreshNotifications]);

  const signUp = useCallback(
    async (input: { email: string; password: string; fullName: string }) => {
      const { error, result } = await authService.signUp(input);
      if (error) {
        return { error, requiresEmailConfirmation: false };
      }
      if (result?.sessionStarted) {
        await refreshProfile();
      }
      return { error: null, requiresEmailConfirmation: result?.requiresEmailConfirmation ?? false };
    },
    [refreshProfile]
  );

  const signOut = useCallback(async () => {
    setNotifications([]);
    setUnreadNotifications(0);
    setUnreadFriendRequests(0);
    setUnreadMessages(0);
    setOnlineUserIds(new Set());
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
    await authService.signOut();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      isLoading,
      session,
      user: session?.user ?? null,
      profile,
      notifications,
      unreadNotifications,
      unreadFriendRequests,
      unreadMessages,
      onlineUserIds,
      messagesVersion,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      refreshUnreadCounts,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [isLoading, session, profile, notifications, unreadNotifications, unreadFriendRequests, unreadMessages, onlineUserIds, messagesVersion, signIn, signUp, signOut, refreshProfile, refreshUnreadCounts, refreshNotifications, markNotificationRead, markAllNotificationsRead]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within a <SessionProvider />");
  }
  return value;
}
