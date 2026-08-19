/**
 * SocialHub design system - typography.
 * Clean Android-friendly levels. fontFamily is left undefined
 * so each platform uses its default system font (Roboto on Android).
 */

import type { TextStyle } from "react-native";

export type TypographyLevel =
  | "display"
  | "heading"
  | "title"
  | "body"
  | "caption"
  | "small"
  | "button";

export interface TypographyStyle extends TextStyle {
  fontSize: number;
  fontWeight: TextStyle["fontWeight"];
  lineHeight: number;
  letterSpacing: number;
}

export const typography: Record<TypographyLevel, TypographyStyle> = {
  display: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  small: {
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    letterSpacing: 0.2,
  },
};

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;
