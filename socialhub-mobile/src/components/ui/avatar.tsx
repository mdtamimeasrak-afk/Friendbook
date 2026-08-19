import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/context/theme";
import { AppText } from "@/components/ui/app-text";
import { thumbnailUrl } from "@/utils/media";

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  online?: boolean;
}

const FALLBACK_COLORS = ["#6366F1", "#22D3EE", "#F472B6", "#F59E0B", "#10B981", "#8B5CF6"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Avatar: loads the profile image (disk-cached) or falls back
 * to a colored circle with the user's initials. If the image URL
 * fails to load, it falls back to initials instead of a broken image.
 */
export function Avatar({ uri, name, size = 48, online = false }: AvatarProps) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";
  const fallbackColor = FALLBACK_COLORS[hashString(name ?? "") % FALLBACK_COLORS.length];
  const showImage = Boolean(uri) && !imageFailed;

  return (
    <View style={{ width: size, height: size }}>
      {showImage ? (
        <Image
          source={{ uri: thumbnailUrl(uri, size) ?? undefined }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={uri!}
          onError={() => setImageFailed(true)}
          accessibilityLabel={name ? `${name}'s avatar` : "Avatar"}
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: fallbackColor },
          ]}
        >
          <AppText level="title" color="white" style={[styles.initial, { fontSize: size * 0.42 }]}>
            {initial}
          </AppText>
        </View>
      )}
      {online ? <View style={[styles.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, borderColor: colors.card, backgroundColor: colors.success }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "transparent",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontWeight: "800",
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderWidth: 2,
  },
});