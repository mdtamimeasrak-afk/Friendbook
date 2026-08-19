import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AppText } from "@/components/ui/app-text";
import type { Profile } from "@/types/database";

export interface CreatePostComposerProps {
  profile: Profile | null;
  onPress: () => void;
}

function firstName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.split(/\s+/)[0];
}

/**
 * Home composer: avatar + "What's on your mind, {name}?" plus
 * Photo / Video / Feeling shortcuts. Tapping opens the Create
 * Post screen.
 */
export function CreatePostComposer({ profile, onPress }: CreatePostComposerProps) {
  const { colors } = useTheme();
  const name = firstName(profile?.full_name);
  const prompt = name ? `What's on your mind, ${name}?` : "What's on your mind?";

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open the create post screen"
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={styles.row}>
          <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={44} />
          <View
            style={[
              styles.input,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <AppText level="body" color="textMuted" numberOfLines={1}>
              {prompt}
            </AppText>
          </View>
        </View>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a photo"
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
          onPress={onPress}
        >
          <Ionicons name="images-outline" size={20} color={colors.success} />
          <AppText level="body" color="textSecondary">Photo</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a video"
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
          onPress={onPress}
        >
          <Ionicons name="videocam-outline" size={20} color={colors.error} />
          <AppText level="body" color="textSecondary">Video</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share how you feel"
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
          onPress={onPress}
        >
          <Ionicons name="happy-outline" size={20} color={colors.warning} />
          <AppText level="body" color="textSecondary">Feeling</AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    minHeight: 44,
  },
});