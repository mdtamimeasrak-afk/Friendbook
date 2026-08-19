import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { spacing } from "@/constants/spacing";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ message = "Something went wrong.", onRetry, retryLabel = "Try again" }: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={44} color={colors.textMuted} />
      <AppText level="title" align="center" style={styles.title}>
        Oops!
      </AppText>
      <AppText level="body" color="textMuted" align="center" style={styles.message}>
        {message}
      </AppText>
      {onRetry ? (
        <View style={styles.buttonWrap}>
          <AppButton title={retryLabel} onPress={onRetry} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  title: {
    marginTop: spacing.sm,
  },
  message: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  buttonWrap: {
    width: 180,
  },
});