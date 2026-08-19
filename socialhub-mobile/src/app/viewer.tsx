import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";

/**
 * Reusable full-screen media viewer (route: /viewer?uri=...&type=image|video).
 * Images use expo-image with pinch-to-zoom (1x–4x, double-tap to reset);
 * videos play inline with a native player. Close via the top button.
 */
export default function MediaViewerScreen() {
  const { uri, type } = useLocalSearchParams<{ uri?: string; type?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const isVideo = type === "video";
  const player = useVideoPlayer(isVideo && uri ? { uri } : null);

  const scale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(4, Math.max(1, event.scale));
    })
    .onEnd(() => {
      if (scale.value <= 1.2) {
        scale.value = withSpring(1);
      } else {
        scale.value = withSpring(Math.min(4, Math.max(1, scale.value)));
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!uri) {
    return null;
  }

  return (
    <Screen edges={["top", "left", "right", "bottom"]} padded={false} style={styles.screen}>
      <View style={[styles.backdrop, { backgroundColor: "#000000" }]}>
        {isVideo ? (
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls
            accessibilityLabel="Video player"
          />
        ) : (
          <GestureDetector gesture={Gesture.Simultaneous(pinch, doubleTap)}>
            <Animated.View style={[styles.zoomContainer, zoomStyle]}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={uri}
                accessibilityLabel="Image viewer"
              />
            </Animated.View>
          </GestureDetector>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close viewer"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            { top: insets.top + spacing.sm, opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={8}
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>

        <View style={[styles.fallbackHint, { bottom: insets.bottom + spacing.xl }]} pointerEvents="none">
          <AppText level="caption" color="textMuted">
            {isVideo ? "Video playing" : "Pinch to zoom"}
          </AppText>
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
  zoomContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  fallbackHint: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});