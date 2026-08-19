import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { brand } from "@/constants/theme";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";

export interface BrandLogoProps {
  size?: number;
  showName?: boolean;
}

/** SocialHub brand mark: gradient rounded square with an "S". */
export function BrandLogo({ size = 44, showName = false }: BrandLogoProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={[brand.gradientStart, brand.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mark, { width: size, height: size, borderRadius: radius.medium * (size / 44) }]}
      >
        <AppText level="title" color="white" style={styles.letter}>
          S
        </AppText>
      </LinearGradient>
      {showName ? (
        <AppText level="title" style={styles.name}>
          SocialHub
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontSize: 22,
    fontWeight: "800",
  },
  name: {
    letterSpacing: -0.2,
  },
});