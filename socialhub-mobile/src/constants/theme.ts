/**
 * SocialHub design system - colors.
 * Single source of truth: screens/components must use these tokens,
 * never hardcoded color literals.
 */

export const brand = {
  primary: "#6366F1",
  primaryDark: "#4F46E5",
  primaryDarker: "#4338CA",
  primarySoft: "#EEF0FF",
  secondary: "#22D3EE",
  tertiary: "#F472B6",
  gradientStart: "#6366F1",
  gradientEnd: "#22D3EE",
} as const;

export const feedback = {
  error: "#EF4444",
  errorSoft: "#FEE2E2",
  success: "#10B981",
  successSoft: "#D1FAE5",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  info: "#3B82F6",
  infoSoft: "#DBEAFE",
} as const;

export interface ThemeColors {
  scheme: "light" | "dark";

  background: string;
  backgroundElevated: string;
  card: string;
  cardPressed: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  border: string;
  divider: string;

  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  secondary: string;

  error: string;
  errorSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;

  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  skeleton: string;
  overlay: string;
  tabBar: string;
  storyRing: string;
}

export const lightColors: ThemeColors = {
  scheme: "light",

  background: "#F3F4F7",
  backgroundElevated: "#FFFFFF",
  card: "#FFFFFF",
  cardPressed: "#F3F4F6",

  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  textInverse: "#FFFFFF",

  border: "#E5E7EB",
  divider: "#EEF0F3",

  primary: brand.primary,
  primaryPressed: brand.primaryDark,
  primarySoft: brand.primarySoft,
  onPrimary: "#FFFFFF",
  secondary: brand.secondary,

  error: feedback.error,
  errorSoft: feedback.errorSoft,
  success: feedback.success,
  successSoft: feedback.successSoft,
  warning: feedback.warning,
  warningSoft: feedback.warningSoft,

  inputBackground: "#F3F4F6",
  inputBorder: "#E5E7EB",
  placeholder: "#9CA3AF",

  skeleton: "#E5E7EB",
  overlay: "rgba(17, 24, 39, 0.45)",
  tabBar: "#FFFFFF",
  storyRing: brand.primary,
};

export const darkColors: ThemeColors = {
  scheme: "dark",

  background: "#0E0F13",
  backgroundElevated: "#14161C",
  card: "#181A21",
  cardPressed: "#20232C",

  text: "#F3F4F6",
  textSecondary: "#D1D5DB",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  border: "#272A33",
  divider: "#1F222A",

  primary: "#818CF8",
  primaryPressed: "#6366F1",
  primarySoft: "rgba(99, 102, 241, 0.16)",
  onPrimary: "#FFFFFF",
  secondary: "#22D3EE",

  error: "#F87171",
  errorSoft: "rgba(248, 113, 113, 0.14)",
  success: "#34D399",
  successSoft: "rgba(52, 211, 153, 0.14)",
  warning: "#FBBF24",
  warningSoft: "rgba(251, 191, 36, 0.14)",

  inputBackground: "#12141A",
  inputBorder: "#272A33",
  placeholder: "#6B7280",

  skeleton: "#23262F",
  overlay: "rgba(0, 0, 0, 0.6)",
  tabBar: "#14161C",
  storyRing: "#818CF8",
};

export function getColors(scheme: "light" | "dark"): ThemeColors {
  return scheme === "dark" ? darkColors : lightColors;
}
