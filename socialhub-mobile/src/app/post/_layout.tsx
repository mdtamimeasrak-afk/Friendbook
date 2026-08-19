import { Stack } from "expo-router";

import { useThemedHeaderOptions } from "@/components/navigation/themed-header";

export default function PostLayout() {
  const headerOptions = useThemedHeaderOptions();

  return (
    <Stack screenOptions={{ ...headerOptions, title: "Post" }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="edit" options={{ title: "Edit Post", headerShown: false }} />
    </Stack>
  );
}