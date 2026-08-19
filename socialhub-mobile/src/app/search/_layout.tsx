import { Stack } from "expo-router";

import { useThemedHeaderOptions } from "@/components/navigation/themed-header";

export default function SearchLayout() {
  const headerOptions = useThemedHeaderOptions();

  return (
    <Stack screenOptions={{ ...headerOptions }}>
      <Stack.Screen name="index" options={{ title: "Search" }} />
    </Stack>
  );
}