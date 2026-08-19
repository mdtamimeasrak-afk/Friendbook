import { StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";

export interface TabScreenTitleProps {
  title: string;
  right?: React.ReactNode;
}

/** Standard heading row for tab screens (Friends, Notifications...). */
export function TabScreenTitle({ title, right }: TabScreenTitleProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <AppText level="heading">{title}</AppText>
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
});