import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { storyService } from "@/services/storyService";
import { profileService } from "@/services/profileService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import type { Profile, Story } from "@/types/database";

const IMAGE_SECONDS = 5;

/**
 * Full-screen story viewer (Step 4):
 * - Loads the selected user's active stories (newest first)
 * - Segmented progress bars, tap left/right to navigate
 * - Hold to pause; images auto-advance every 5s, videos play through
 * - Marks each story as viewed (story_views upsert) once it's shown
 * - Reply button opens the (architecture-ready) messages route
 */
export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useSession();

  const [stories, setStories] = useState<Story[]>([]);
  const [author, setAuthor] = useState<Pick<Profile, "id" | "full_name" | "username" | "avatar_url"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const indexRef = useRef(0);
  const storiesRef = useRef<Story[]>([]);
  const pausedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoPlayer = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Missing user.");
      return;
    }
    setLoading(true);
    setError(null);
    const { stories: userStories, error: storiesError } = await storyService.getStoriesForUser(String(id));
    const { profile, error: profileError } = await profileService.getProfile(String(id));
    if (storiesError || profileError) {
      setLoading(false);
      setError(storiesError ?? profileError ?? "Could not load this story.");
      return;
    }
    storiesRef.current = userStories;
    setStories(userStories);
    setAuthor(profile);
    setIndex(0);
    indexRef.current = 0;
    setProgress(0);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Move to the next story (or close when finished).
  const advance = useCallback(() => {
    const nextIndex = indexRef.current + 1;
    if (nextIndex < storiesRef.current.length) {
      setIndex(nextIndex);
    } else {
      close();
    }
  }, [close]);

  const goBack = useCallback(() => {
    const prevIndex = indexRef.current - 1;
    if (prevIndex >= 0) {
      setIndex(prevIndex);
    }
  }, []);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    stopTick();
    setProgress(0);
    tickRef.current = setInterval(() => {
      if (pausedRef.current) {
        return;
      }
      setProgress((previous) => {
        const next = previous + 100 / (IMAGE_SECONDS * 1000) * 100; // 100ms ticks
        if (next >= 1) {
          advance();
          return 0;
        }
        return next;
      });
    }, 100);
  }, [advance, stopTick]);

  // Load + play the video for a video story; mark it viewed.
  useEffect(() => {
    const story = storiesRef.current[indexRef.current];
    if (!story) {
      return;
    }
    if (user) {
      storyService.markViewed(story.id, user.id);
    }
    if (story.media_type === "video") {
      stopTick();
      setProgress(0);
      videoPlayer.replaceAsync({ uri: story.media_url });
      videoPlayer.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, stories]);

  // Auto-advance images with a 5s timer; videos drive their own progress.
  useEffect(() => {
    const story = storiesRef.current[indexRef.current];
    if (!story) {
      return;
    }
    if (story.media_type === "image") {
      startTick();
    }
  }, [index, startTick, stories]);

  // Video playback progress + completion.
  useEffect(() => {
    const timeSub = videoPlayer.addListener("timeUpdate", ({ currentTime }) => {
      const duration = videoPlayer.duration;
      if (duration > 0) {
        setProgress(Math.min(1, currentTime / duration));
      }
    });
    const endSub = videoPlayer.addListener("playToEnd", () => {
      advance();
    });
    return () => {
      timeSub.remove();
      endSub.remove();
    };
  }, [videoPlayer, advance]);

  // Keep refs in sync with state so the gesture handlers are stable.
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      stopTick();
      videoPlayer.pause();
    } else {
      const story = storiesRef.current[indexRef.current];
      if (story?.media_type === "video") {
        videoPlayer.play();
      } else {
        startTick();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, startTick, stopTick]);

  const onPressStart = useCallback(() => setPaused(true), []);
  const onPressEnd = useCallback(() => setPaused(false), []);

  const handleTap = useCallback(
    (eventX: number) => {
      const width = Dimensions.get("window").width;
      if (eventX < width * 0.3) {
        goBack();
      } else {
        advance();
      }
    },
    [advance, goBack]
  );

  useEffect(() => {
    return () => {
      stopTick();
    };
  }, [stopTick]);

  if (loading) {
    return (
      <Screen padded={false} edges={["top", "left", "right", "bottom"]} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </Screen>
    );
  }

  if (error || stories.length === 0) {
    return (
      <Screen padded={false} edges={["top", "left", "right", "bottom"]} style={styles.screen}>
        <View style={styles.centered}>
          <EmptyState
            icon="image-outline"
            title="No stories"
            description={error ?? "This person has no active stories right now."}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close stories"
            onPress={close}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </Screen>
    );
  }

  const story = stories[index];
  const total = stories.length;

  return (
    <Screen padded={false} edges={["top", "left", "right", "bottom"]} style={styles.screen}>
      <View style={styles.backdrop}>
        {story.media_type === "video" ? (
          <VideoView
            player={videoPlayer}
            style={styles.media}
            contentFit="contain"
            nativeControls={false}
            accessibilityLabel="Story video"
          />
        ) : (
          <Image
            source={{ uri: story.media_url }}
            style={styles.media}
            contentFit="contain"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={story.media_url}
            accessibilityLabel="Story photo"
          />
        )}

        {/* Progress bars */}
        <View style={[styles.progressRow, { top: insets.top + spacing.sm }]}>
          {stories.map((item, i) => {
            const fill = i < index ? 1 : i === index ? progress : 0;
            return (
              <View key={item.id} style={[styles.progressTrack, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${fill * 100}%`, backgroundColor: "#FFFFFF" },
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Header */}
        <View style={[styles.header, { top: insets.top + spacing.md }]}>
          <Avatar uri={author?.avatar_url} name={author?.full_name} size={36} />
          <View style={styles.headerText}>
            <AppText level="body" weight="700" color="white" numberOfLines={1}>
              {author?.full_name?.trim() || author?.username?.trim() || "SocialHub user"}
            </AppText>
            {story.caption ? (
              <AppText level="caption" color="white" numberOfLines={2} style={styles.caption}>
                {story.caption}
              </AppText>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close story"
            onPress={close}
            style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Bottom actions */}
        <View style={[styles.footer, { bottom: insets.bottom + spacing.lg }]}>
          {user && id !== user.id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reply to this story"
              onPress={() => router.push({ pathname: "/messages/[id]", params: { id } })}
              style={({ pressed }) => [styles.replyButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
              <AppText level="body" weight="600" color="white">
                Reply
              </AppText>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}
        </View>

        {/* Tap zones (hold to pause) */}
        <View
          style={StyleSheet.absoluteFill}
          onTouchStart={onPressStart}
          onTouchEnd={onPressEnd}
          onTouchCancel={onPressEnd}
        >
          <Pressable
            style={styles.tapLeft}
            accessibilityRole="button"
            accessibilityLabel="Previous story"
            onPress={(event) => handleTap(event.nativeEvent.pageX)}
          />
          <Pressable
            style={styles.tapRight}
            accessibilityRole="button"
            accessibilityLabel="Next story"
            onPress={(event) => handleTap(event.nativeEvent.pageX)}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#000000",
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  media: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  progressRow: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  header: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    zIndex: 10,
  },
  headerText: {
    flex: 1,
  },
  caption: {
    marginTop: 2,
    opacity: 0.9,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  footerSpacer: {
    height: 24,
  },
  tapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "30%",
  },
  tapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "70%",
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: spacing.md,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});