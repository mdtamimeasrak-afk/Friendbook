import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";

export interface PostActionsProps {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

export function formatCount(count: number): string {
  if (count >= 1000) {
    const value = count / 1000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)}K`;
  }
  return String(count);
}

/**
 * Post action bar: Like / Comment / Share / Save with counts.
 * Like and Save support active states; the heart does a subtle
 * spring pop and gives light haptic feedback.
 */
export function PostActions({
  likeCount,
  commentCount,
  shareCount,
  likedByMe,
  savedByMe,
  onLike,
  onComment,
  onShare,
  onSave,
}: PostActionsProps) {
  const { colors } = useTheme();
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Haptics.selectionAsync();
    heartScale.setValue(0.6);
    Animated.spring(heartScale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
    onLike();
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={likedByMe ? "Unlike this post" : "Like this post"}
        accessibilityState={{ selected: likedByMe }}
        onPress={handleLike}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Ionicons
            name={likedByMe ? "heart" : "heart-outline"}
            size={22}
            color={likedByMe ? colors.error : colors.textSecondary}
          />
        </Animated.View>
        <AppText level="body" color={likedByMe ? "error" : "textSecondary"}>
          {formatCount(likeCount)}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Comment on this post"
        onPress={onComment}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="chatbubble-outline" size={21} color={colors.textSecondary} />
        <AppText level="body" color="textSecondary">
          {formatCount(commentCount)}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share this post"
        onPress={onShare}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="arrow-redo-outline" size={21} color={colors.textSecondary} />
        <AppText level="body" color="textSecondary">
          {formatCount(shareCount)}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={savedByMe ? "Remove from saved posts" : "Save this post"}
        accessibilityState={{ selected: savedByMe }}
        onPress={onSave}
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons
          name={savedByMe ? "bookmark" : "bookmark-outline"}
          size={21}
          color={savedByMe ? colors.primary : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
});