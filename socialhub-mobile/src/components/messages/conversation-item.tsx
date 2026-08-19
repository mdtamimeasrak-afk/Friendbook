import { Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Avatar } from "@/components/ui/avatar";
import { AppText } from "@/components/ui/app-text";
import { Badge } from "@/components/ui/badge";

export interface ConversationItemProps {
  avatarUrl?: string | null;
  name?: string | null;
  lastMessage?: string;
  timeLabel?: string;
  unreadCount?: number;
  online?: boolean;
  onPress?: () => void;
}

/**
 * Conversation row for the messages list: avatar (with online dot),
 * name (bold when unread), last-message preview, time and unread badge.
 */
export function ConversationItem({
  avatarUrl,
  name,
  lastMessage,
  timeLabel,
  unreadCount = 0,
  online = false,
  onPress,
}: ConversationItemProps) {
  const { colors } = useTheme();
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      accessibilityLabel={`Open conversation with ${name ?? "user"}${hasUnread ? `, ${unreadCount} unread messages` : ""}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: hasUnread ? colors.primarySoft : pressed ? colors.cardPressed : "transparent",
        },
      ]}
    >
      <View style={styles.avatarWrap}>
        <Avatar uri={avatarUrl} name={name} size={52} />
        {online ? <View style={[styles.onlineDot, { borderColor: colors.background, backgroundColor: colors.success }]} /> : null}
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <AppText level="body" weight={hasUnread ? "700" : "500"} numberOfLines={1} style={styles.name}>
            {name || "User"}
          </AppText>
          {timeLabel ? (
            <AppText level="small" color={hasUnread ? "text" : "textMuted"}>
              {timeLabel}
            </AppText>
          ) : null}
        </View>
        <View style={styles.messageRow}>
          <AppText
            level="body"
            weight={hasUnread ? "600" : "400"}
            color={hasUnread ? "text" : "textMuted"}
            numberOfLines={1}
            style={styles.message}
          >
            {lastMessage || "No messages yet"}
          </AppText>
          {hasUnread ? <Badge count={unreadCount} /> : null}
        </View>
      </View>
      <View style={styles.chevron}>
        <AppText level="small" color="textMuted">
          ›
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  name: {
    fontSize: 16,
    flex: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  message: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});