import { useRouter } from "expo-router";
import { useCallback } from "react";

import { useSession } from "@/context/session";
import { Screen } from "@/components/ui/screen";
import { ProfileScreen } from "@/components/profile/profile-screen";

/**
 * Profile tab - the authenticated user's own premium profile.
 */
export default function ProfileTabScreen() {
  const { user } = useSession();
  const router = useRouter();

  const openSettings = useCallback(() => router.push("/settings"), [router]);

  const openEditProfile = useCallback(() => router.push("/profile/edit"), [router]);

  const openProfile = useCallback(
    (userId: string) => {
      router.push({ pathname: "/profile/[id]", params: { id: userId } });
    },
    [router]
  );

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

  if (!user) {
    return null;
  }

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <ProfileScreen
        userId={user.id}
        isOwnProfile
        onEditProfile={openEditProfile}
        onOpenSettings={openSettings}
        onOpenImageViewer={openImageViewer}
        onOpenPost={openPost}
        onOpenProfile={openProfile}
      />
    </Screen>
  );
}