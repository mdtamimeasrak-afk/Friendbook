import { StyleSheet, View } from "react-native";

import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";

export interface BadgeProps {
  count: number;
  max?: number;
}

/** Small notification badge: hidden at zero, "9+" for larger counts. */
export function Badge({ count, max = 9 }: BadgeProps) {
  const { colors } = useTheme();

  if (count <= 0) {
    return null;
  }

  const label = count > max ? `${max}+` : String(count);

  return (
    <View style={[styles.badge, { backgroundColor: colors.error }]}>
      <AppText level="small" color="white" style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
  },
});