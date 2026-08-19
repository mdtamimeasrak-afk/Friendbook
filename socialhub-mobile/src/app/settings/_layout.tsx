import { Stack } from "expo-router";

import { useThemedHeaderOptions } from "@/components/navigation/themed-header";

export default function SettingsLayout() {
  const headerOptions = useThemedHeaderOptions();

  return (
    <Stack screenOptions={{ ...headerOptions }}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
    </Stack>
  );
}