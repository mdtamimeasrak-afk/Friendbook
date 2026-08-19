import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";
import { spacing } from "@/constants/spacing";

export function LoadingView({ label = "Loading..." }: { label?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? (
        <AppText level="caption" color="textMuted" style={styles.label}>
          {label}
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
  label: {
    marginTop: spacing.sm,
  },
});