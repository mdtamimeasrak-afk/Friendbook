import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { IconButton } from "@/components/ui/icon-button";

export interface ImageViewerProps {
  uri: string;
}

/**
 * Full-screen image viewer foundation (Step 2).
 * Zoom, swipe and multi-image support arrive in a later step.
 */
export function ImageViewer({ uri }: ImageViewerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory-disk"
        recyclingKey={uri}
        accessibilityLabel="Post photo"
      />
      <View style={[styles.closeWrap, { top: insets.top + spacing.sm }]}>
        <IconButton
          name="close"
          size={24}
          accessibilityLabel="Close image viewer"
          onPress={() => router.back()}
          backgroundColor="rgba(255,255,255,0.15)"
          color="#FFFFFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  image: {
    flex: 1,
  },
  closeWrap: {
    position: "absolute",
    right: spacing.md,
  },
});