import { StyleSheet, View } from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Card } from "@/components/ui/card";

/**
 * Skeleton feed card shown while the first page loads.
 * Mirrors the real PostCard layout: header, text, media, actions.
 */
export function SkeletonPost() {
  const { colors, radius: radii } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.skeleton }]} />
        <View style={styles.lines}>
          <View style={[styles.line, { backgroundColor: colors.skeleton }]} />
          <View style={[styles.lineShort, { backgroundColor: colors.skeleton }]} />
        </View>
      </View>
      <View style={[styles.textBlock, { backgroundColor: colors.skeleton }]} />
      <View style={[styles.media, { backgroundColor: colors.skeleton, borderRadius: radii.medium }]} />
      <View style={styles.actions}>
        <View style={[styles.actionLine, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.actionLine, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.actionLine, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.actionLine, { backgroundColor: colors.skeleton }]} />
      </View>
    </Card>
  );
}

export function SkeletonFeed() {
  return (
    <View style={styles.feed}>
      <SkeletonPost />
      <SkeletonPost />
      <SkeletonPost />
    </View>
  );
}

const styles = StyleSheet.create({
  feed: {
    gap: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  lines: {
    flex: 1,
    gap: spacing.xs,
  },
  line: {
    height: 12,
    width: "55%",
    borderRadius: radius.small,
  },
  lineShort: {
    height: 10,
    width: "35%",
    borderRadius: radius.small,
  },
  textBlock: {
    height: 16,
    width: "90%",
    borderRadius: radius.small,
    marginBottom: spacing.md,
  },
  media: {
    height: 180,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionLine: {
    height: 12,
    width: 52,
    borderRadius: radius.small,
  },
});