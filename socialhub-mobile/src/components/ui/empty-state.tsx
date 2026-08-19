import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/constants/spacing";

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = "file-tray-outline", title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name={icon} size={34} color={colors.textMuted} />
      </View>
      <AppText level="title" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText level="body" color="textMuted" align="center" style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppText level="button" color="primary" onPress={onAction} style={styles.action}>
          {actionLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  description: {
    marginTop: spacing.xs,
    maxWidth: 260,
  },
  action: {
    marginTop: spacing.md,
  },
});