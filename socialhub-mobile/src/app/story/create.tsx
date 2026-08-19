import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { storyService } from "@/services/storyService";
import { mediaService, type PickedMedia } from "@/services/mediaService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";

/**
 * Story composer - pick a photo or video, preview it, then publish.
 * Media uploads to the existing 'stories' bucket; the story row is
 * created with the 24h expiry handled by the schema default.
 */
export default function CreateStoryScreen() {
  const { colors } = useTheme();
  const { user } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoLaunched = useRef(false);

  // When navigated from the home sheet with a mode, jump straight to the
  // right picker instead of showing the empty state first.
  useEffect(() => {
    if (autoLaunched.current) {
      return;
    }
    autoLaunched.current = true;
    if (mode === "photo") {
      pickImage();
    } else if (mode === "video") {
      pickVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const videoPlayer = useVideoPlayer(mediaType === "video" && media ? { uri: media.uri } : null, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const chooseSource = () => {
    Alert.alert("Add a story", "What would you like to share?", [
      { text: "Take photo", onPress: takePhoto },
      { text: "Choose photo", onPress: pickImage },
      { text: "Choose video", onPress: pickVideo },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const takePhoto = async () => {
    setPicking(true);
    try {
      const { media: picked, error: pickError } = await mediaService.takePhoto();
      handlePickResult(picked, pickError, "image");
    } finally {
      setPicking(false);
    }
  };

  const pickImage = async () => {
    setPicking(true);
    try {
      const { media: picked, error: pickError } = await mediaService.pickImage();
      handlePickResult(picked, pickError, "image");
    } finally {
      setPicking(false);
    }
  };

  const pickVideo = async () => {
    setPicking(true);
    try {
      const { media: picked, error: pickError } = await mediaService.pickVideo();
      handlePickResult(picked, pickError, "video");
    } finally {
      setPicking(false);
    }
  };

  const handlePickResult = (picked: PickedMedia | null, pickError: string | null, type: "image" | "video") => {
    if (pickError) {
      setError(pickError);
      return;
    }
    if (!picked) {
      return;
    }
    Haptics.selectionAsync();
    setMedia(picked);
    setMediaType(type);
    setError(null);
  };

  const publish = async () => {
    if (!user || !media || !mediaType || uploading) {
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const bucket = mediaType === "image" ? "stories" : "stories";
      const path = mediaService.buildPath(user.id, media);
      const { url, error: uploadError } = await mediaService.uploadFile(bucket, path, media);
      if (uploadError) {
        setUploading(false);
        setError(uploadError);
        return;
      }
      const { error: createError } = await storyService.createStory({
        userId: user.id,
        mediaUrl: url,
        mediaType,
        caption: caption.trim() || null,
      });
      setUploading(false);
      if (createError) {
        setError(createError);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch {
      setUploading(false);
      setError("Something went wrong. Check your connection and try again.");
    }
  };

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <Screen edges={["top", "left", "right", "bottom"]} padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close create story"
            onPress={close}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <AppText level="heading">Create story</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {media && mediaType ? (
            <View style={styles.previewWrap}>
              {mediaType === "image" ? (
                <Image
                  source={{ uri: media.uri }}
                  style={styles.preview}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={media.uri}
                  accessibilityLabel="Story photo preview"
                />
              ) : (
                <VideoView
                  player={videoPlayer}
                  style={styles.preview}
                  contentFit="cover"
                  nativeControls={false}
                  accessibilityLabel="Story video preview"
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove selected media"
                onPress={() => {
                  setMedia(null);
                  setMediaType(null);
                }}
                style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.7 : 1 }]}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose photo or video for your story"
              disabled={picking || uploading}
              onPress={chooseSource}
              style={({ pressed }) => [
                styles.pickerBox,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.inputBackground,
                  opacity: pressed || picking ? 0.6 : 1,
                },
              ]}
            >
              {picking ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={48} color={colors.primary} />
                  <AppText level="body" color="textSecondary" align="center">
                    Choose a photo or video for your story
                  </AppText>
                </>
              )}
            </Pressable>
          )}

          {media ? (
            <TextInput
              style={[styles.captionInput, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
              placeholder="Add a caption (optional)"
              placeholderTextColor={colors.placeholder}
              value={caption}
              onChangeText={setCaption}
              maxLength={120}
              accessibilityLabel="Story caption"
            />
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
            title={uploading ? "Publishing…" : "Publish story"}
            onPress={publish}
            disabled={!media || uploading}
            loading={uploading}
            style={styles.publishButton}
          />

          <AppText level="caption" color="textMuted" align="center" style={styles.note}>
            Stories disappear after 24 hours.
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
    paddingBottom: spacing.sm,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  headerSpacer: {
    width: 26,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  pickerBox: {
    aspectRatio: 9 / 16,
    maxHeight: 480,
    borderRadius: radius.large,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  previewWrap: {
    position: "relative",
    borderRadius: radius.large,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: 520,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  captionInput: {
    minHeight: 52,
    borderRadius: radius.medium,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    fontSize: 16,
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
  publishButton: {
    marginTop: spacing.lg,
  },
  note: {
    marginTop: spacing.lg,
  },
});