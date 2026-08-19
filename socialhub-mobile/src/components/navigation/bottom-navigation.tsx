import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand } from "@/constants/theme";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useSession } from "@/context/session";
import { useTheme } from "@/context/theme";
import { Badge } from "@/components/ui/badge";
import { AppText } from "@/components/ui/app-text";

type TabKey = "home" | "friends" | "create" | "notifications" | "profile";

const TABS: Array<{
  key: TabKey;
  label: string;
  route: "/" | "/friends" | "/create" | "/notifications" | "/profile";
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "home", label: "Home", route: "/", icon: "home-outline", iconActive: "home" },
  { key: "friends", label: "Friends", route: "/friends", icon: "people-outline", iconActive: "people" },
  { key: "create", label: "Create", route: "/create", icon: "add-circle-outline", iconActive: "add-circle" },
  { key: "notifications", label: "Alerts", route: "/notifications", icon: "notifications-outline", iconActive: "notifications" },
  { key: "profile", label: "Profile", route: "/profile", icon: "person-outline", iconActive: "person" },
];

function getActiveKey(pathname: string): TabKey {
  if (pathname === "/") {
    return "home";
  }
  if (pathname === "/friends") {
    return "friends";
  }
  if (pathname === "/create") {
    return "create";
  }
  if (pathname === "/notifications") {
    return "notifications";
  }
  if (pathname === "/profile") {
    return "profile";
  }
  return "home";
}

/**
 * Premium floating bottom navigation: Home, Friends, Create
 * (elevated gradient center button), Notifications (badge),
 * Profile. Rounded elevated container above the system nav bar.
 */
export function BottomNavigation() {
  const { colors } = useTheme();
  const { unreadNotifications, unreadFriendRequests } = useSession();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeKey = getActiveKey(pathname);

  return (
    <View
      style={[
        styles.shell,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.border,
            shadowColor: "#000000",
          },
        ]}
      >
        {TABS.map((tab) => {
          const active = activeKey === tab.key;

          if (tab.key === "create") {
            return (
              <Link
                key={tab.key}
                href={tab.route}
                style={styles.item}
                accessibilityLabel="Create post"
              >
                <View style={styles.createWrap}>
                  <LinearGradient
                    colors={[brand.gradientStart, brand.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createButton}
                  >
                    <Ionicons name="add" size={30} color="#FFFFFF" />
                  </LinearGradient>
                  <AppText level="small" color={active ? "primary" : "textMuted"} style={styles.label}>
                    {tab.label}
                  </AppText>
                </View>
              </Link>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.route}
              style={styles.item}
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={active ? tab.iconActive : tab.icon}
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
                {tab.key === "notifications" && unreadNotifications > 0 ? (
                  <View style={styles.badgeWrap}>
                    <Badge count={unreadNotifications} />
                  </View>
                ) : null}
                {tab.key === "friends" && unreadFriendRequests > 0 ? (
                  <View style={styles.badgeWrap}>
                    <Badge count={unreadFriendRequests} />
                  </View>
                ) : null}
              </View>
              <AppText level="small" color={active ? "primary" : "textMuted"} style={styles.label}>
                {tab.label}
              </AppText>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: radius.extraLarge,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: {
    position: "absolute",
    top: -3,
    right: -10,
  },
  label: {
    marginTop: 3,
  },
  createWrap: {
    alignItems: "center",
    marginTop: -26,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: brand.primary,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});