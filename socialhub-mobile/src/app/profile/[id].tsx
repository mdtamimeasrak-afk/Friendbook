import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Screen } from "@/components/ui/screen";
import { ProfileScreen } from "@/components/profile/profile-screen";

/**
 * Other-user profile (profile/[id]).
 * Works for any user id - never assumes the logged-in user.
 */
export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const openImageViewer = useCallback(
    (uri: string, type: "image" | "video" = "image") => {
      router.push({ pathname: "/viewer", params: { uri, type } });
    },
    [router]
  );

  const openPost = useCallback(
    (postId: string) => {
      router.push({ pathname: "/post/[id]", params: { id: postId } });
    },
    [router]
  );

  const openChat = useCallback(
    (otherUserId: string) => {
      router.push({ pathname: "/messages/[id]", params: { id: otherUserId } });
    },
    [router]
  );

  const openProfile = useCallback(
    (userId: string) => {
      router.push({ pathname: "/profile/[id]", params: { id: userId } });
    },
    [router]
  );

  if (!id) {
    return null;
  }

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <ProfileScreen
        userId={id}
        isOwnProfile={false}
        onOpenImageViewer={openImageViewer}
        onOpenPost={openPost}
        onOpenChat={openChat}
        onOpenProfile={openProfile}
      />
      <View style={[styles.backWrap, { top: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.overlay, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backWrap: {
    position: "absolute",
    left: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});