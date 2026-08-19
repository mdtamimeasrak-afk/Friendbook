import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const { colors } = useTheme();

  const isDisabled = disabled || loading;

  const background =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.error
        : variant === "outline"
          ? "transparent"
          : variant === "ghost"
            ? "transparent"
            : colors.primarySoft;

  const border = variant === "outline" ? { borderWidth: 1.5, borderColor: colors.primary } : null;

  const textColor =
    variant === "primary" || variant === "danger"
      ? colors.onPrimary
      : variant === "outline"
        ? colors.primary
        : colors.text;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth ? styles.fullWidth : null,
        { backgroundColor: background, opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 },
        border,
        style as StyleProp<ViewStyle>,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon ?? null}
          <TextContent title={title} textColor={textColor} />
        </View>
      )}
    </Pressable>
  );
}

function TextContent({ title, textColor }: { title: string; textColor: string }) {
  return (
    <AppText level="button" style={{ color: textColor }}>
      {title}
    </AppText>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
