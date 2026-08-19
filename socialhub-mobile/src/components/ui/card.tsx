import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  const { colors, radius: radii } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderRadius: radii.large, borderColor: colors.border },
        padded ? styles.padded : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  padded: {
    padding: spacing.md,
  },
});
