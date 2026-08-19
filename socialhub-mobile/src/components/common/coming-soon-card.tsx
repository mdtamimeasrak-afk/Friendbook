import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Card } from "@/components/ui/card";
import { AppText } from "@/components/ui/app-text";

export interface ComingSoonCardProps {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Placeholder card shown on screens whose full feature
 * ships in later steps.
 */
export function ComingSoonCard({ title, description, icon = "construct-outline" }: ComingSoonCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <AppText level="title">{title}</AppText>
          <AppText level="caption" color="textMuted" style={styles.description}>
            {description}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xxs,
  },
});