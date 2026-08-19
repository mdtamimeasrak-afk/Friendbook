import { Text, type TextProps, type TextStyle } from "react-native";

import { typography, type TypographyLevel } from "@/constants/typography";
import { useTheme } from "@/context/theme";

export interface AppTextProps extends TextProps {
  level?: TypographyLevel;
  color?: "text" | "textSecondary" | "textMuted" | "textInverse" | "primary" | "error" | "success" | "warning" | "white";
  align?: TextStyle["textAlign"];
  weight?: TextStyle["fontWeight"];
}

const colorKeys: Record<NonNullable<AppTextProps["color"]>, keyof ReturnType<typeof useTheme>["colors"]> = {
  text: "text",
  textSecondary: "textSecondary",
  textMuted: "textMuted",
  textInverse: "textInverse",
  primary: "primary",
  error: "error",
  success: "success",
  warning: "warning",
  white: "textInverse",
};

export function AppText({ level = "body", color = "text", align, weight, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();

  return (
    <Text
      {...rest}
      style={[
        typography[level],
        { color: colors[colorKeys[color]], textAlign: align },
        weight ? { fontWeight: weight } : null,
        style as TextStyle | null,
      ]}
    />
  );
}
