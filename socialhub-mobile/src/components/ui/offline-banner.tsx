import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNetwork } from "@/context/network";
import { useTheme } from "@/context/theme";
import { spacing } from "@/constants/spacing";
import { AppText } from "@/components/ui/app-text";

/**
 * Global offline indicator (Step 7): a thin non-blocking bar under
 * the status area. Shows "You're offline" while disconnected and
 * "Back online" briefly after reconnecting.
 */
export function OfflineBanner() {
  const { isOnline, backOnline } = useNetwork();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (isOnline && !backOnline) {
    return null;
  }

  const visible = !isOnline;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + spacing.xs,
          backgroundColor: visible ? "rgba(100, 60, 20, 0.92)" : "rgba(20, 100, 60, 0.92)",
        },
      ]}
    >
      <AppText level="caption" style={styles.text}>
        {visible ? "You're offline" : "Back online"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: spacing.xs,
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});