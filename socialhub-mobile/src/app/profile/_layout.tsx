import { Stack } from "expo-router";

import { useThemedHeaderOptions } from "@/components/navigation/themed-header";

export default function ProfileLayout() {
  const headerOptions = useThemedHeaderOptions();

  return (
    <Stack screenOptions={{ ...headerOptions, title: "Profile" }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}