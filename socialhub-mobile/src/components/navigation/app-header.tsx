import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { useSession } from "@/context/session";
import { useTheme } from "@/context/theme";
import { BrandLogo } from "@/components/common/brand-logo";
import { IconButton } from "@/components/ui/icon-button";

/**
 * Home screen header: SocialHub logo left,
 * Search / Messages / Notifications actions right.
 */
export function AppHeader() {
  const { colors } = useTheme();
  const { unreadMessages, unreadNotifications } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xs,
        },
      ]}
    >
      <View style={styles.logoWrap}>
        <BrandLogo size={36} showName />
      </View>
      <View style={styles.actions}>
        <IconButton
          name="search"
          size={22}
          accessibilityLabel="Search"
          onPress={() => router.push("/search")}
        />
        <IconButton
          name="chatbubble-ellipses"
          size={22}
          accessibilityLabel="Messages"
          badgeCount={unreadMessages}
          onPress={() => router.push("/messages")}
        />
        <IconButton
          name="notifications"
          size={22}
          accessibilityLabel="Notifications"
          badgeCount={unreadNotifications}
          onPress={() => router.push("/notifications")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  logoWrap: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});