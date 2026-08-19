import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { notificationService, type NotificationFeedItem } from "@/services/notificationService";
import { pushService } from "@/services/pushService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TabScreenTitle } from "@/components/common/tab-screen-title";
import { timeAgo } from "@/utils/time";

const TYPE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  like: { icon: "heart", color: "#EF4444" },
  comment: { icon: "chatbubble", color: "#3B82F6" },
  friend_request: { icon: "person-add", color: "#8B5CF6" },
  friend_accepted: { icon: "people", color: "#10B981" },
  group_invite: { icon: "people-circle", color: "#F59E0B" },
  event_invite: { icon: "calendar", color: "#3B82F6" },
  general: { icon: "notifications", color: "#6B7280" },
};

function typeIcon(type: string): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  return TYPE_ICONS[type] ?? { icon: "notifications", color: "#6B7280" };
}

function fallbackText(type: string): string {
  switch (type) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "friend_request":
      return "sent you a friend request";
    case "friend_accepted":
      return "accepted your friend request";
    case "group_invite":
      return "invited you to a group";
    case "event_invite":
      return "invited you to an event";
    default:
      return "interacted with you";
  }
}

/**
 * Notifications screen. Reads the centralized list from the session
 * context (updated by the single realtime subscription) and loads
 * older pages on demand.
 */
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead, refreshNotifications } = useSession();
  const router = useRouter();

  const [older, setOlder] = useState<NotificationFeedItem[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstFocus = useRef(true);

  const allItems = useMemo(() => {
    const known = new Set<string>();
    const merged: NotificationFeedItem[] = [];
    [...notifications, ...older].forEach((item) => {
      if (!known.has(item.id)) {
        known.add(item.id);
        merged.push(item);
      }
    });
    return merged;
  }, [notifications, older]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) {
      return;
    }
    setLoadingOlder(true);
    setError(null);
    const page = Math.floor(notifications.length / notificationService.PAGE_SIZE);
    const { notifications: next, error: loadError } = await notificationService.getFeed(page, notificationService.PAGE_SIZE);
    setLoadingOlder(false);
    if (loadError) {
      setError("Couldn't load older notifications.");
      return;
    }
    setOlder((previous) => {
      const known = new Set([...notifications, ...previous].map((item) => item.id));
      return [...previous, ...next.filter((item) => !known.has(item.id))];
    });
    setHasMore(next.length === notificationService.PAGE_SIZE);
  }, [loadingOlder, hasMore, notifications]);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        // Step 7: ask for notification permission at a meaningful
        // moment - the user just opened the notifications tab.
        pushService.requestPermissionIfNeeded().catch(() => {
          // Best-effort: never block the tab on a permission prompt.
        });
        return;
      }
      refreshNotifications();
    }, [refreshNotifications])
  );

  const openNotification = useCallback(
    async (item: NotificationFeedItem) => {
      if (!item.read) {
        await markNotificationRead(item.id);
      }
      if (item.type === "like" || item.type === "comment") {
        if (item.post_id) {
          router.push({ pathname: "/post/[id]", params: { id: item.post_id } });
        }
        return;
      }
      if (item.actor_id) {
        router.push({ pathname: "/profile/[id]", params: { id: item.actor_id } });
      }
    },
    [markNotificationRead, router]
  );

  const markAll = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const renderItem = ({ item }: { item: NotificationFeedItem }) => {
    const visual = typeIcon(item.type);
    const actorName = item.actor?.full_name?.trim() || item.actor?.username?.trim() || "Someone";
    const text = item.content || fallbackText(item.type);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Notification from ${actorName}: ${text}`}
        onPress={() => openNotification(item)}
        style={({ pressed }) => [
          styles.item,
          {
            backgroundColor: item.read ? colors.card : colors.primarySoft,
            borderColor: colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Avatar uri={item.actor?.avatar_url} name={actorName} size={46} />
        <View style={styles.itemBody}>
          <AppText level="body" numberOfLines={2}>
            <AppText level="body" weight="700">
              {actorName}
            </AppText>
            {` ${text}`}
          </AppText>
          <AppText level="caption" color="textMuted">
            {timeAgo(item.created_at)}
          </AppText>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name={visual.icon} size={16} color={visual.color} />
        </View>
        {!item.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (loadingOlder) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.footer}>
          <AppText level="body" color="error">
            {error}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try loading older notifications again"
            onPress={loadOlder}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <AppText level="body" color="primary" weight="600">
              Try again
            </AppText>
          </Pressable>
        </View>
      );
    }
    if (!hasMore && allItems.length > 0) {
      return (
        <View style={styles.footer}>
          <AppText level="caption" color="textMuted">
            You're all caught up.
          </AppText>
        </View>
      );
    }
    return null;
  };

  const renderBody = () => {
    if (allItems.length === 0) {
      return (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          description="Likes, comments and friend requests will show up here."
        />
      );
    }

    return (
      <FlatList
        data={allItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        onEndReached={loadOlder}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <TabScreenTitle
        title="Notifications"
        right={
          unreadNotifications > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              onPress={markAll}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <AppText level="body" color="primary" weight="600">
                Mark all read
              </AppText>
            </Pressable>
          ) : null
        }
      />
      {renderBody()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemBody: {
    flex: 1,
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  footer: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
});