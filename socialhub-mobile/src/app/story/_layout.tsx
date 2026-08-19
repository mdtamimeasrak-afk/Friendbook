import { Stack } from "expo-router";

import { useThemedHeaderOptions } from "@/components/navigation/themed-header";

export default function StoryLayout() {
  const headerOptions = useThemedHeaderOptions();

  return (
    <Stack screenOptions={{ ...headerOptions, headerShown: false, animation: "fade" }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
    </Stack>
  );
}