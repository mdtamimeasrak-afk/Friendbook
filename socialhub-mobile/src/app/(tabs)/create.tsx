import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { postService } from "@/services/postService";
import { mediaService, type PickedMedia } from "@/services/mediaService";
import { getStorageJson, setStorageJson, removeStorageItem } from "@/lib/storage";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { AppButton } from "@/components/ui/app-button";
import type { PostAudience } from "@/types/database";

const AUDIENCES: Array<{ key: PostAudience | string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "public", label: "Public", icon: "earth-outline" },
  { key: "friends", label: "Friends", icon: "people-outline" },
  { key: "friends_of_friends", label: "Friends of friends", icon: "people-circle-outline" },
  { key: "only_me", label: "Only me", icon: "lock-closed-outline" },
];

const DRAFT_KEY = "socialhubCreateDraft";

interface Draft {
  content: string;
  audience: string;
}

/**
 * Create Post composer: text + one image or one video (the existing
 * schema stores a single image_url / video_url per post). Media is
 * uploaded to the existing post-images / videos buckets, then the post
 * row is created. Text is preserved as a draft so accidental closes
 * never lose a long post.
 */
export default function CreateScreen() {
  const { colors } = useTheme();
  const { user, profile } = useSession();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<PostAudience | string>("public");
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadedBucket = useRef<"post-images" | "videos" | null>(null);

  // Restore the saved draft (text + audience) on mount.
  useEffect(() => {
    let cancelled = false;
    getStorageJson<Draft>(DRAFT_KEY).then((draft) => {
      if (cancelled || !draft) {
        return;
      }
      setContent(draft.content ?? "");
      if (draft.audience) {
        setAudience(draft.audience);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced draft persistence so long posts survive accidental closes.
  const persistDraft = useCallback((nextContent: string, nextAudience: string) => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
    }
    draftTimer.current = setTimeout(() => {
      setStorageJson(DRAFT_KEY, { content: nextContent, audience: nextAudience });
    }, 500);
  }, []);

  useEffect(() => {
    persistDraft(content, audience);
    return () => {
      if (draftTimer.current) {
        clearTimeout(draftTimer.current);
      }
    };
  }, [content, audience, persistDraft]);

  const clearDraft = useCallback(async () => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
    }
    await removeStorageItem(DRAFT_KEY);
  }, []);

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  const trimmed = content.trim();
  const hasMedia = Boolean(media);
  const canPost = (trimmed.length > 0 || hasMedia) && !posting && !uploading;

  const pickPhotoOptions = () => {
    Alert.alert("Add a photo", "Choose how you want to add a photo.", [
      { text: "Take photo", onPress: runTakePhoto },
      { text: "Choose from gallery", onPress: runPickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const runPickImage = async () => {
    setPicking(true);
    try {
      const { media: picked, error: pickError } = await mediaService.pickImage();
      if (pickError) {
        setError(pickError);
        return;
      }
      if (picked) {
        Haptics.selectionAsync();
        setMedia(picked);
        setMediaType("image");
        setError(null);
      }
    } catch {
      setError("Could not open the gallery. Check permissions and try again.");
    } finally {
      setPicking(false);
    }
  };

  const runTakePhoto = async () => {
    setPicking(true);
    try {
      const { media: picked, error: pickError } = await mediaService.takePhoto();
      if (pickError) {
        setError(pickError);
        return;
      }
      if (picked) {
        Haptics.selectionAsync();
        setMedia(picked);
        setMediaType("image");
        setError(null);
      }
    } catch {
      setError("The camera could not be opened.");
    } finally {
      setPicking(false);
    }
  };

  const runPickVideo = async () => {
    setPicking(true);
    try {
      const { media: picked, error: pickError } = await mediaService.pickVideo();
      if (pickError) {
        setError(pickError);
        return;
      }
      if (picked) {
        Haptics.selectionAsync();
        setMedia(picked);
        setMediaType("video");
        setError(null);
      }
    } catch {
      setError("Could not open the video picker.");
    } finally {
      setPicking(false);
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaType(null);
    setUploadedUrl(null);
    uploadedBucket.current = null;
  };

  const submit = async () => {
    if (!user || !canPost) {
      return;
    }

    setError(null);

    // Upload media first (if any), then create the DB record.
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    if (media && mediaType) {
      setUploading(true);
      setPosting(true);
      try {
        // Clean up a partial upload from a previous attempt (avoids orphans).
        if (uploadedUrl && uploadedPath && uploadedBucket.current) {
          await mediaService.deleteByPublicUrl(uploadedUrl, uploadedBucket.current);
          setUploadedUrl(null);
          setUploadedPath(null);
        }

        const bucket = mediaType === "image" ? "post-images" : "videos";
        const path = mediaService.buildPath(user.id, media);
        const { url, error: uploadError } = await mediaService.uploadFile(bucket, path, media);
        if (uploadError) {
          setUploading(false);
          setPosting(false);
          setError(uploadError);
          return;
        }
        setUploadedUrl(url);
        setUploadedPath(path);
        uploadedBucket.current = bucket;
        if (mediaType === "image") {
          imageUrl = url;
        } else {
          videoUrl = url;
        }
      } catch {
        setUploading(false);
        setPosting(false);
        setError("Something went wrong while uploading. Check your connection and try again.");
        return;
      }
    }

    // Create the post record (RLS: auth.uid() = user_id).
    const { error: createError } = await postService.createPost({
      userId: user.id,
      content: trimmed,
      imageUrl,
      videoUrl,
      audience,
    });

    if (createError) {
      setUploading(false);
      setPosting(false);
      setError(createError);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await clearDraft();
    setContent("");
    setMedia(null);
    setMediaType(null);
    setUploadedUrl(null);
    uploadedBucket.current = null;
    router.replace("/");
  };

  const videoPlayer = useVideoPlayer(mediaType === "video" && media ? { uri: media.uri } : null, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <Screen edges={["top", "left", "right", "bottom"]} padded={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close create post"
            onPress={close}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <AppText level="heading">Create post</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.identityRow}>
            <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={44} />
            <View style={styles.identityMeta}>
              <AppText level="body" weight="700">
                {profile?.full_name?.trim() || "SocialHub user"}
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
                      <Ionicons
                        name={item.icon}
                        size={14}
                        color={active ? colors.primary : colors.textMuted}
                      />
                      <AppText level="caption" color={active ? "primary" : "textMuted"}>
                        {item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Card padded={false} style={styles.editorCard}>
            <TextInput
              style={[styles.editor, { color: colors.text }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.placeholder}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus={!media}
              textAlignVertical="top"
              accessibilityLabel="Post text"
            />

            {media && mediaType ? (
              <View style={styles.previewWrap}>
                {mediaType === "image" ? (
                  <Image
                    source={{ uri: media.uri }}
                    style={styles.preview}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={media.uri}
                    accessibilityLabel="Selected photo preview"
                  />
                ) : (
                  <VideoView
                    player={videoPlayer}
                    style={styles.preview}
                    contentFit="cover"
                    nativeControls={false}
                    accessibilityLabel="Selected video preview"
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected media"
                  onPress={removeMedia}
                  style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.7 : 1 }]}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </Pressable>
                <View style={styles.mediaTypeBadge} pointerEvents="none">
                  <AppText level="caption" color="white">
                    {mediaType === "image" ? "Photo" : "Video"}
                  </AppText>
                </View>
              </View>
            ) : null}

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.mediaRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a photo"
                disabled={picking || uploading}
                onPress={pickPhotoOptions}
                style={({ pressed }) => [styles.mediaButton, { opacity: pressed || picking ? 0.6 : 1 }]}
              >
                <Ionicons name="images-outline" size={22} color={colors.success} />
                <AppText level="body" color="textSecondary">Photo</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a video"
                disabled={picking || uploading}
                onPress={runPickVideo}
                style={({ pressed }) => [styles.mediaButton, { opacity: pressed || picking ? 0.6 : 1 }]}
              >
                <Ionicons name="videocam-outline" size={22} color={colors.error} />
                <AppText level="body" color="textSecondary">Video</AppText>
              </Pressable>
            </View>
          </Card>

          {uploading ? (
            <View style={[styles.uploadBox, { backgroundColor: colors.inputBackground }]}>
              <ActivityIndicator color={colors.primary} size="small" />
              <AppText level="body" color="textSecondary">
                Uploading your {mediaType ?? "media"}…
              </AppText>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <AppText level="caption" color="error" style={styles.errorText}>
                {error}
              </AppText>
            </View>
          ) : null}

          <AppButton
            title={uploading ? "Uploading…" : "Post"}
            onPress={submit}
            disabled={!canPost}
            loading={posting && !uploading}
            fullWidth
            style={styles.submit}
          />

          <AppText level="caption" color="textMuted" align="center" style={styles.note}>
            Your post respects the same audience rules as the website.
          </AppText>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  headerSpacer: {
    width: 26,
  },
  scroll: {
    padding: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  identityMeta: {
    flex: 1,
    gap: spacing.xs,
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
  editorCard: {
    padding: spacing.md,
  },
  editor: {
    minHeight: 120,
    fontSize: 17,
    lineHeight: 24,
  },
  previewWrap: {
    marginTop: spacing.md,
    position: "relative",
    borderRadius: radius.medium,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  removeButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaTypeBadge: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  mediaRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    minHeight: 44,
  },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
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
  submit: {
    marginTop: spacing.lg,
  },
  note: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});