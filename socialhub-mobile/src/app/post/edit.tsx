import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { postService } from "@/services/postService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { ErrorState } from "@/components/ui/error-state";
import type { PostAudience } from "@/types/database";

const AUDIENCES: Array<{ key: PostAudience | string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "public", label: "Public", icon: "earth-outline" },
  { key: "friends", label: "Friends", icon: "people-outline" },
  { key: "friends_of_friends", label: "Friends of friends", icon: "people-circle-outline" },
  { key: "only_me", label: "Only me", icon: "lock-closed-outline" },
];

/**
 * Edit Post - edits content + audience, matching the website's edit
 * modal (media on a post cannot be changed). Saves via RLS (owner only).
 */
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { user } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<PostAudience | string>("public");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    postService.getPostById(String(id)).then(({ post, error: loadError }) => {
      setLoading(false);
      if (loadError || !post) {
        setNotFound(true);
        return;
      }
      setContent(post.content ?? "");
      setAudience(post.audience ?? "public");
    });
  }, [id]);

  if (loading) {
    return (
      <Screen edges={["left", "right", "bottom"]} padded={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (notFound) {
    return (
      <Screen edges={["left", "right", "bottom"]} padded={false}>
        <ErrorState message="This post could not be found or you can't edit it." onRetry={() => router.back()} />
      </Screen>
    );
  }

  const trimmed = content.trim();
  const canSave = trimmed.length > 0 && !saving;

  const save = async () => {
    if (!id || !user || !canSave) {
      return;
    }
    setError(null);
    setSaving(true);
    const { error: saveError } = await postService.updatePost(String(id), {
      content: trimmed,
      audience,
    });
    if (saveError) {
      setError(saveError);
      setSaving(false);
      return;
    }
    router.back();
  };

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close edit post"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText level="heading">Edit Post</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save post changes"
            disabled={!canSave}
            onPress={save}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed || saving ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <AppText level="body" color="primary" weight="700">
              {saving ? "Saving…" : "Save"}
            </AppText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText level="caption" color="textSecondary" style={styles.groupLabel}>
            Audience
          </AppText>
          <View style={styles.audienceRow}>
            {AUDIENCES.map((item) => {
              const active = audience === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Set audience to ${item.label}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => setAudience(item.key)}
                  style={({ pressed }) => [
                    styles.audienceChip,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.inputBackground,
                      borderColor: active ? colors.primary : colors.inputBorder,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={14} color={active ? colors.primary : colors.textMuted} />
                  <AppText level="caption" color={active ? "primary" : "textMuted"}>
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText level="caption" color="textSecondary" style={styles.groupLabel}>
            Post text
          </AppText>
          <TextInput
            style={[styles.editor, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Post text"
          />

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <AppText level="caption" color="error" style={styles.errorText}>
                {error}
              </AppText>
            </View>
          ) : null}

          <AppButton title="Save changes" onPress={save} disabled={!canSave} loading={saving} style={styles.saveButton} />
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  groupLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  audienceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 32,
  },
  editor: {
    minHeight: 160,
    fontSize: 17,
    lineHeight: 24,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    padding: spacing.md,
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