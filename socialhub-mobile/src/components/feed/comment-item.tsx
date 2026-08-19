import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Avatar } from "@/components/ui/avatar";
import { AppText } from "@/components/ui/app-text";
import { timeAgo } from "@/utils/time";
import type { CommentWithProfile } from "@/services/commentService";

export interface CommentItemProps {
  comment: CommentWithProfile;
  isMine: boolean;
  onPressAuthor: () => void;
  onDelete: () => void;
}

/** A single comment: avatar, name, @username, text, timestamp, delete. */
export function CommentItem({ comment, isMine, onPressAuthor, onDelete }: CommentItemProps) {
  const { colors } = useTheme();

  const name = comment.profiles?.full_name?.trim() || comment.profiles?.username?.trim() || "SocialHub user";

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${name}'s profile`}
        onPress={onPressAuthor}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <Avatar uri={comment.profiles?.avatar_url} name={name} size={36} />
      </Pressable>
      <View style={[styles.bubble, { backgroundColor: colors.inputBackground }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${name}'s profile`}
          onPress={onPressAuthor}
        >
          <AppText level="body" weight="700" numberOfLines={1}>
            {name}
          </AppText>
        </Pressable>
        {comment.profiles?.username ? (
          <AppText level="caption" color="textMuted">
            @{comment.profiles.username}
          </AppText>
        ) : null}
        <AppText level="body" style={styles.text}>
          {comment.content}
        </AppText>
        <AppText level="caption" color="textMuted">
          {timeAgo(comment.created_at)}
        </AppText>
      </View>
      {isMine ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete your comment"
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bubble: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  deleteButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});