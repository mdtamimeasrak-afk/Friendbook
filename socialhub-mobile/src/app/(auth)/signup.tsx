import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useSession } from "@/context/session";
import { useTheme } from "@/context/theme";
import { BrandLogo } from "@/components/common/brand-logo";
import { Screen } from "@/components/ui/screen";
import { AppInput } from "@/components/ui/app-input";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { validateSignup } from "@/utils/validation";

type SignupState = "form" | "confirming" | "success";

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp } = useSession();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<SignupState>("form");

  async function handleSignup() {
    const validationError = validateSignup(fullName, email, password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { error: signupError, requiresEmailConfirmation } = await signUp({
        email,
        password,
        fullName,
      });
      if (signupError) {
        setError(signupError);
        return;
      }
      if (requiresEmailConfirmation) {
        setState("confirming");
      } else {
        setState("success");
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (state === "confirming" || state === "success") {
    return (
      <Screen edges={["top", "bottom"]}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="mail-open-outline" size={44} color={colors.success} />
          </View>
          <AppText level="heading" align="center">
            {state === "confirming" ? "Check your email" : "Account created!"}
          </AppText>
          <AppText level="body" color="textMuted" align="center" style={styles.successText}>
            {state === "confirming"
              ? "We sent you a confirmation link. Confirm your email, then log in to SocialHub."
              : "Your SocialHub account is ready. Log in to get started."}
          </AppText>
          <AppButton title="Go to login" onPress={() => router.replace("/")} style={styles.successButton} />
        </View>
      </Screen>
    );
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
          <View style={styles.header}>
            <BrandLogo size={48} />
            <AppText level="heading" style={styles.title}>
              Create account
            </AppText>
            <AppText level="body" color="textMuted">
              Join SocialHub in a few seconds
            </AppText>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Full name"
              placeholder="Your name"
              autoComplete="name"
              textContentType="name"
              value={fullName}
              onChangeText={setFullName}
            />
            <AppInput
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              containerStyle={styles.field}
            />
            <AppInput
              label="Password"
              placeholder="At least 6 characters"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              containerStyle={styles.field}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  onPress={() => setShowPassword((visible) => !visible)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              }
            />
            <AppInput
              label="Confirm password"
              placeholder="Repeat your password"
              secureTextEntry={!showConfirm}
              autoComplete="new-password"
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              containerStyle={styles.field}
              onSubmitEditing={handleSignup}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showConfirm ? "Hide password" : "Show password"}
                  onPress={() => setShowConfirm((visible) => !visible)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              }
            />

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <AppText level="caption" color="error" style={styles.errorText}>
                  {error}
                </AppText>
              </View>
            ) : null}

            <AppButton title="Sign up" onPress={handleSignup} loading={loading} style={styles.signupButton} />
          </View>

          <View style={styles.footer}>
            <AppText level="body" color="textMuted">
              Already have an account?{" "}
              <AppText level="body" color="primary" weight="600" onPress={() => router.replace("/")}>
                Log in
              </AppText>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: "flex-start",
    marginBottom: spacing.xl,
  },
  title: {
    marginTop: spacing.md,
  },
  form: {
    width: "100%",
  },
  field: {
    marginTop: spacing.md,
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
  signupButton: {
    marginTop: spacing.xl,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  successText: {
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  successButton: {
    marginTop: spacing.xl,
    width: 200,
  },
});