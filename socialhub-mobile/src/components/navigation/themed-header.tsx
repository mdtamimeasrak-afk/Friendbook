import type { NativeStackNavigationOptions } from "expo-router";

import { useTheme } from "@/context/theme";

/**
 * Themed header options for stack screens (back arrow, colors,
 * safe area). Usage: screenOptions={useThemedHeaderOptions()}.
 */
export function useThemedHeaderOptions(): NativeStackNavigationOptions {
  const { colors } = useTheme();

  return {
    headerShown: true,
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text, fontWeight: "700", fontSize: 17 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
    headerBackButtonDisplayMode: "minimal",
  };
}