/**
 * SocialHub design system - corner radius scale.
 */

export const radius = {
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 24,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radius;
