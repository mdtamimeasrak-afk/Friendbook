import { forwardRef, type ReactNode } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  /** Small muted hint shown below the input (hidden while an error is shown). */
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional element rendered on the right inside the input (e.g. password visibility toggle). */
  trailing?: ReactNode;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, error, containerStyle, style, trailing, helper, ...rest },
  ref
) {
  const { colors, radius: radii } = useTheme();

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText level="caption" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
          style={[styles.input, { color: colors.text }, style]}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? (
        <AppText level="caption" color="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText level="caption" color="textMuted" style={styles.errorText}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xxs + 2,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.medium,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    fontSize: 16,
  },
  trailing: {
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  errorText: {
    marginTop: spacing.xxs + 2,
  },
});