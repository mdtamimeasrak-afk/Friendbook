import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { spacing } from "@/constants/spacing";
import { Avatar } from "@/components/ui/avatar";
import { AppText } from "@/components/ui/app-text";

export interface UserIdentityProps {
  name?: string | null;
  username?: string | null;
  avatarUri?: string | null;
  avatarSize?: number;
  /** Optional extra line under the username (e.g. a timestamp). */
  meta?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable identity block: avatar + display name + @username.
 * Falls back gracefully when name/username are missing.
 */
export function UserIdentity({ name, username, avatarUri, avatarSize = 44, meta, onPress, style }: UserIdentityProps) {
  const displayName = name?.trim() || username?.trim() || "SocialHub user";

  const content = (
    <>
      <Avatar uri={avatarUri} name={displayName} size={avatarSize} />
      <View style={styles.meta}>
        <AppText level="body" weight="700" numberOfLines={1}>
          {displayName}
        </AppText>
        <AppText level="caption" color="textMuted" numberOfLines={1}>
          {username ? `@${username}${meta ? ` · ${meta}` : ""}` : meta ?? null}
        </AppText>
      </View>
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${displayName}'s profile`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, style, { opacity: pressed ? 0.7 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  meta: {
    flexShrink: 1,
  },
});