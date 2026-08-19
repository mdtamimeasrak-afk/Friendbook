import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { brand } from "@/constants/theme";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Avatar } from "@/components/ui/avatar";
import { AppText } from "@/components/ui/app-text";

export interface StoryItemProps {
  uri?: string | null;
  name?: string | null;
  onPress?: () => void;
  isMine?: boolean;
  seen?: boolean;
}

/**
 * A single story ring: gradient ring when unseen, muted ring when
 * seen, and a "Your story" variant with an add badge.
 */
export function StoryItem({ uri, name, onPress, isMine = false, seen = false }: StoryItemProps) {
  const { colors } = useTheme();

  const label = isMine ? "Add to your story" : `View ${name ?? "a friend"}'s story`;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.ring, seen ? styles.ringSeen : null]}>
        {seen ? (
          <View style={[styles.ringCircle, { borderColor: colors.border }]}>
            <View style={[styles.inner, { backgroundColor: colors.card }]}>
              <Avatar uri={uri} name={name} size={58} />
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={[brand.gradientStart, brand.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ringCircle}
          >
            <View style={[styles.inner, { backgroundColor: colors.card }]}>
              <Avatar uri={uri} name={name} size={58} />
            </View>
          </LinearGradient>
        )}
      </View>

      {isMine ? (
        <View
          style={[styles.addBadge, { backgroundColor: colors.primary, borderColor: colors.card }]}
          accessibilityElementsHidden
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
        </View>
      ) : null}

      <AppText level="small" color="textSecondary" numberOfLines={1} style={styles.name}>
        {isMine ? "Your story" : (name ?? "Story")}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 76,
    alignItems: "center",
  },
  ring: {
    width: 66,
    height: 66,
  },
  ringSeen: {
    padding: 2,
  },
  ringCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  addBadge: {
    position: "absolute",
    top: 40,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: spacing.xxs,
    maxWidth: 72,
  },
});