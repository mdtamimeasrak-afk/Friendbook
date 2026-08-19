import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { useSession } from "@/context/session";
import { useTheme } from "@/context/theme";
import { profileService } from "@/services/profileService";
import { Screen } from "@/components/ui/screen";
import { AppInput } from "@/components/ui/app-input";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";

const USERNAME_RE = /^[a-z0-9._]+$/;

/**
 * Edit Profile - the same fields the website's settings modal supports:
 * full_name, username, bio, location, education, work, website.
 * Saves via the existing RLS (owner can update own profile row).
 */
export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user, refreshProfile } = useSession();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [education, setEducation] = useState(profile?.education ?? "");
  const [work, setWork] = useState(profile?.work ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const usernameRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const educationRef = useRef<TextInput>(null);
  const workRef = useRef<TextInput>(null);
  const websiteRef = useRef<TextInput>(null);

  if (!user) {
    return null;
  }

  const userId = user.id;

  async function handleSave() {
    const name = fullName.trim();
    const handle = username.trim().toLowerCase();

    if (!name) {
      setError("Please enter your name.");
      return;
    }
    if (!handle) {
      setError("Please enter a username.");
      return;
    }
    if (!USERNAME_RE.test(handle)) {
      setError("Username can only contain lowercase letters, numbers, dots and underscores.");
      return;
    }

    const originalUsername = (profile?.username ?? "").trim().toLowerCase();
    if (handle !== originalUsername) {
      const { taken, error: checkError } = await profileService.isUsernameTaken(handle, userId);
      if (checkError) {
        setError(checkError);
        return;
      }
      if (taken) {
        setError("That username is already taken. Please choose another one.");
        return;
      }
    }

    setError(null);
    setSaving(true);
    try {
      const { error: saveError } = await profileService.updateProfile(userId, {
        full_name: name,
        username: handle,
        bio: bio.trim() || null,
        location: location.trim() || null,
        education: education.trim() || null,
        work: work.trim() || null,
        website: website.trim() || null,
      });
      if (saveError) {
        setError(saveError);
        return;
      }
      await refreshProfile();
      router.back();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText level="heading" style={styles.headerTitle}>
            Edit Profile
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save profile"
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed || saving ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <AppText level="body" color="primary" weight="700">
              {saving ? "Saving…" : "Save"}
            </AppText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppInput
            label="Name"
            placeholder="Your full name"
            autoComplete="name"
            textContentType="name"
            value={fullName}
            onChangeText={setFullName}
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
          />

          <AppInput
            ref={usernameRef}
            label="Username"
            placeholder="username"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            returnKeyType="next"
            onSubmitEditing={() => bioRef.current?.focus()}
            containerStyle={styles.field}
            helper="Letters, numbers, dots and underscores only."
          />

          <AppInput
            ref={bioRef}
            label="Bio"
            placeholder="Tell people about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={200}
            containerStyle={styles.field}
            style={styles.multiline}
          />

          <AppInput
            ref={locationRef}
            label="Location"
            placeholder="City, country"
            value={location}
            onChangeText={setLocation}
            returnKeyType="next"
            onSubmitEditing={() => educationRef.current?.focus()}
            containerStyle={styles.field}
          />

          <AppInput
            ref={educationRef}
            label="Education"
            placeholder="School, college or university"
            value={education}
            onChangeText={setEducation}
            returnKeyType="next"
            onSubmitEditing={() => workRef.current?.focus()}
            containerStyle={styles.field}
          />

          <AppInput
            ref={workRef}
            label="Work"
            placeholder="Where do you work?"
            value={work}
            onChangeText={setWork}
            returnKeyType="next"
            onSubmitEditing={() => websiteRef.current?.focus()}
            containerStyle={styles.field}
          />

          <AppInput
            ref={websiteRef}
            label="Website"
            placeholder="https://…"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            value={website}
            onChangeText={setWebsite}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            containerStyle={styles.field}
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
            title="Save changes"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  field: {
    marginTop: spacing.md,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
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
  saveButton: {
    marginTop: spacing.xl,
  },
});