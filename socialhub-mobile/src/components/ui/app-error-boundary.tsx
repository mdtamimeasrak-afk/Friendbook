import { Component, type PropsWithChildren, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { logger } from "@/lib/logger";
import { spacing } from "@/constants/spacing";
import { AppText } from "@/components/ui/app-text";

interface State {
  hasError: boolean;
}

/**
 * App-level error boundary (Step 7): if a render crashes, show
 * "Something went wrong." with a Try Again button instead of a
 * blank screen. Reset re-renders the tree below the boundary.
 */
export class AppErrorBoundary extends Component<PropsWithChildren<{ fallback?: ReactNode }>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logger.logError("error-boundary", error);
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    if (this.props.fallback) {
      return this.props.fallback;
    }
    return (
      <View style={styles.container}>
        <AppText level="title" style={styles.title}>
          Something went wrong.
        </AppText>
        <AppText level="body" color="textMuted" style={styles.hint}>
          Please try again. If the problem keeps happening, restart the app.
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={this.reset}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <AppText level="body" style={styles.buttonLabel}>
            Try Again
          </AppText>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    textAlign: "center",
  },
  hint: {
    textAlign: "center",
  },
  button: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    backgroundColor: "#6366F1",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});