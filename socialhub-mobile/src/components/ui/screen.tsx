import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/theme";

export interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  edges?: ("top" | "right" | "bottom" | "left")[];
}

/**
 * Standard screen wrapper: themed background, safe area, optional padding.
 */
export function Screen({ children, style, padded = true, edges = ["top", "right", "bottom", "left"] }: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: colors.background }, style]}>
      {padded ? <View style={styles.padded}>{children}</View> : children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  padded: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
