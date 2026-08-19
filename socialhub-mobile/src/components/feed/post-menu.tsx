import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";
import { IconButton } from "@/components/ui/icon-button";

export interface PostMenuProps {
  isOwnPost: boolean;
  savedByMe: boolean;
  onSaveToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

interface MenuOption {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: "default" | "danger";
  onPress: () => void;
}

/**
 * Three-dot post menu. Options depend on ownership. Destructive
 * actions confirm before running.
 */
export function PostMenu({ isOwnPost, savedByMe, onSaveToggle, onDelete, onEdit }: PostMenuProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const options: MenuOption[] = isOwnPost
    ? [
        { key: "edit", label: "Edit post", icon: "create-outline", onPress: () => { setVisible(false); onEdit?.(); } },
        { key: "delete", label: "Delete post", icon: "trash-outline", color: "danger", onPress: () => { setVisible(false); confirmDelete(); } },
      ]
    : [
        { key: "save", label: savedByMe ? "Unsave post" : "Save post", icon: savedByMe ? "bookmark" : "bookmark-outline", onPress: () => { setVisible(false); onSaveToggle(); } },
      ];

  const confirmDelete = () => {
    Alert.alert("Delete post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <>
      <IconButton
        name="ellipsis-horizontal"
        size={20}
        accessibilityLabel="Post options"
        onPress={() => {
          Haptics.selectionAsync();
          setVisible(true);
        }}
      />

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          accessibilityLabel="Close menu"
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderRadius: radius.large, paddingBottom: Math.max(insets.bottom, spacing.md) }]}
            onPress={() => undefined}
          >
            <View style={styles.grabber} />
            <AppText level="title" style={styles.sheetTitle}>
              Post options
            </AppText>
            {options.map((option) => (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                onPress={option.onPress}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: pressed ? colors.cardPressed : "transparent" },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={option.color === "danger" ? colors.error : colors.text}
                />
                <AppText level="body" color={option.color === "danger" ? "error" : "text"}>
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    padding: spacing.md,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.4)",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.medium,
    minHeight: 48,
  },
});