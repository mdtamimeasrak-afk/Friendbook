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

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const signInError = await signIn(email, password);
      if (signInError) {
        setError(signInError);
        return;
      }
      router.replace("/");
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
            <BrandLogo size={64} />
            <AppText level="display" style={styles.appName}>
              SocialHub
            </AppText>
            <AppText level="body" color="textMuted" align="center">
              Connect with friends and your community
            </AppText>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="Password"
              placeholder="Your password"
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              containerStyle={styles.field}
              onSubmitEditing={handleLogin}
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

            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              onPress={() => router.push("/forgot-password")}
              style={styles.forgot}
              hitSlop={6}
            >
              <AppText level="caption" color="primary" weight="600">
                Forgot password?
              </AppText>
            </Pressable>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <AppText level="caption" color="error" style={styles.errorText}>
                  {error}
                </AppText>
              </View>
            ) : null}

            <AppButton
              title="Log in"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <AppText level="body" color="textMuted">
              New to SocialHub?{" "}
              <AppText level="body" color="primary" weight="600" onPress={() => router.push("/signup")}>
                Create account
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
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brand: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  appName: {
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  form: {
    width: "100%",
  },
  field: {
    marginTop: spacing.md,
  },
  forgot: {
    alignSelf: "flex-end",
    marginTop: spacing.sm,
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
  loginButton: {
    marginTop: spacing.xl,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
});