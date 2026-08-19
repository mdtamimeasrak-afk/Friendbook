import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useSession } from "@/context/session";
import { useTheme, type ThemePreference } from "@/context/theme";
import { accountService } from "@/services/accountService";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";

interface SectionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
}

function Section({ items }: { items: SectionItem[] }) {
  const { colors } = useTheme();

  return (
    <Card padded={false} style={styles.section}>
      {items.map((item, index) => (
        <View key={item.label}>
          <PressableRow item={item} />
          {index < items.length - 1 ? (
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          ) : null}
        </View>
      ))}
    </Card>
  );
}

function PressableRow({ item }: { item: SectionItem }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={item.onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.cardPressed : "transparent" }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={item.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <AppText level="body">{item.label}</AppText>
        <AppText level="small" color="textMuted">
          {item.hint}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function ThemeOption({ label, value }: { label: string; value: ThemePreference }) {
  const { colors, themePreference, setThemePreference } = useTheme();
  const active = themePreference === value;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`${label} theme`}
      onPress={() => setThemePreference(value)}
      style={({ pressed }) => [styles.themeRow, { backgroundColor: colors.inputBackground, borderRadius: radius.medium, opacity: pressed ? 0.7 : 1 }]}
    >
      <AppText level="body">{label}</AppText>
      <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border }]}>
        {active ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { signOut } = useSession();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure you want to log out of SocialHub?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete account",
      "Your profile, posts, stories, friendships, messages and all associated data will be permanently deleted. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "This permanently deletes your SocialHub account and all of your data.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete my account",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const { error } = await accountService.deleteAccount();
                      if (error) {
                        Alert.alert("Couldn't delete account", error);
                        return;
                      }
                      await signOut().catch(() => {
                        // Local state clears even if the server call fails.
                      });
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText level="title" style={styles.groupLabel}>
          Appearance
        </AppText>
        <Card padded style={styles.themeCard}>
          <AppText level="body" style={styles.themeTitle}>
            Theme
          </AppText>
          <View style={styles.themeOptions}>
            <ThemeOption label="Light" value="light" />
            <ThemeOption label="Dark" value="dark" />
            <ThemeOption label="System" value="system" />
          </View>
        </Card>

        <AppText level="title" style={styles.groupLabel}>
          Account
        </AppText>
        <Section
          items={[
            { icon: "person-outline", label: "Account details", hint: "Name, username, bio", onPress: () => router.push("/profile/edit") },
            { icon: "lock-closed-outline", label: "Privacy & security", hint: "Password, blocked users", onPress: () => {} },
            { icon: "notifications-outline", label: "Notification settings", hint: "Coming in a later step", onPress: () => {} },
            { icon: "information-circle-outline", label: "About SocialHub", hint: "Version 1.0.0", onPress: () => {} },
          ]}
        />

        <AppButton
          title="Log out"
          variant="danger"
          onPress={confirmLogout}
          loading={loggingOut}
          style={styles.logout}
        />

        <AppText level="small" color="textMuted" style={styles.deleteHint}>
          Deleting your account permanently removes your profile, posts, stories, messages and all associated data.
        </AppText>
        <AppButton
          title="Delete account"
          variant="danger"
          onPress={confirmDeleteAccount}
          loading={deleting}
          style={styles.deleteButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  groupLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  section: {
    marginBottom: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 40 + spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: {
    flex: 1,
  },
  themeCard: {
    marginBottom: spacing.md,
  },
  themeTitle: {
    marginBottom: spacing.sm,
  },
  themeOptions: {
    gap: spacing.xs,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  logout: {
    marginTop: spacing.lg,
  },
  deleteHint: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xxs,
  },
  deleteButton: {
    marginTop: spacing.xs,
  },
});