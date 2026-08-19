import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Badge } from "@/components/ui/badge";

export interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  badgeCount?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  color?: string;
}

/**
 * Touch-friendly icon button with optional badge and
 * mandatory accessibility label.
 */
export function IconButton({
  name,
  onPress,
  size = 22,
  badgeCount = 0,
  accessibilityLabel,
  style,
  backgroundColor,
  color,
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: backgroundColor ?? colors.inputBackground,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? colors.text} />
      {badgeCount > 0 ? <View style={styles.badgeWrap}><Badge count={badgeCount} /></View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: {
    position: "absolute",
    top: 2,
    right: 2,
  },
});