import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

import { darkColors, getColors, lightColors, type ThemeColors } from "@/constants/theme";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { getStorageItem, setStorageItem, storageKeys } from "@/lib/storage";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  themePreference: ThemePreference;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolvePreference(
  preference: ThemePreference,
  systemScheme: "light" | "dark" | "unspecified" | null | undefined
): ThemePreference {
  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return preference;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    getStorageItem(storageKeys.theme).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemePreferenceState(stored);
      }
    });
  }, []);

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    await setStorageItem(storageKeys.theme, preference);
  }, []);

  const resolved = resolvePreference(themePreference, systemScheme);
  const isDark = resolved === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      themePreference,
      isDark,
      colors: isDark ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      setThemePreference,
    }),
    [themePreference, isDark, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within a <ThemeProvider />");
  }
  return value;
}

export { getColors, lightColors, darkColors };
