import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { authService } from "@/services/authService";
import { BrandLogo } from "@/components/common/brand-logo";
import { Screen } from "@/components/ui/screen";
import { AppInput } from "@/components/ui/app-input";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const sendError = await authService.resetPassword(email);
      if (sendError.error) {
        setError(sendError.error);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <BrandLogo size={56} />
            <AppText level="title" style={styles.title}>
              Reset your password
            </AppText>
            <AppText level="body" color="textMuted" align="center">
              Enter the email you signed up with and we&apos;ll send you a link to
              set a new password.
            </AppText>
          </View>

          {sent ? (
            <View style={styles.form}>
              <View style={[styles.successBox, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText level="body" color="success" style={styles.successText}>
                  Check your inbox! If an account exists for {email.trim()}, a reset
                  link is on its way.
                </AppText>
              </View>
              <AppButton
                title="Back to log in"
                variant="secondary"
                onPress={() => router.replace("/")}
                style={styles.sendButton}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <AppInput
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={handleSend}
              />

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <AppText level="caption" color="error" style={styles.errorText}>
                    {error}
                  </AppText>
                </View>
              ) : null}

              <AppButton
                title="Send reset link"
                onPress={handleSend}
                loading={loading}
                style={styles.sendButton}
              />
            </View>
          )}

          <View style={styles.footer}>
            <AppText level="body" color="primary" weight="600" onPress={() => router.back()}>
              Back to log in
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brand: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.sm,
  },
  form: {
    width: "100%",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    flex: 1,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
  },
  successText: {
    flex: 1,
  },
  sendButton: {
    marginTop: spacing.xl,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
});