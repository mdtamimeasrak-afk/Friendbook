import { Stack } from "expo-router";

import { useThemedHeaderOptions } from "@/components/navigation/themed-header";

export default function MessagesLayout() {
  const headerOptions = useThemedHeaderOptions();

  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Messages" }} />
      <Stack.Screen name="new" options={{ title: "New Message" }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}