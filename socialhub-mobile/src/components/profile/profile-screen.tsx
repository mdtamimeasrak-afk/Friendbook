import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Share, StyleSheet, View } from "react-native";

import { brand } from "@/constants/theme";
import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";
import { postService } from "@/services/postService";
import { friendService } from "@/services/friendService";
import { Avatar } from "@/components/ui/avatar";
import { AppText } from "@/components/ui/app-text";
import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { FeedPost, Profile } from "@/types/database";
import type { FriendStatusResult } from "@/services/friendService";

type ProfileTab = "posts" | "about" | "friends" | "photos";

interface AboutRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | null;
}

export interface ProfileScreenProps {
  userId: string;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenImageViewer?: (uri: string, type?: "image" | "video") => void;
  onOpenPost?: (postId: string) => void;
  onOpenChat?: (userId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

interface ProfileState {
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  posts: FeedPost[];
  hasMorePosts: boolean;
  photos: FeedPost[];
  friends: Profile[];
  postsCount: number;
  friendsCount: number;
  friendStatus: FriendStatusResult["status"];
  busy: boolean;
}

const INITIAL_STATE: ProfileState = {
  loading: true,
  error: null,
  profile: null,
  posts: [],
  hasMorePosts: false,
  photos: [],
  friends: [],
  postsCount: 0,
  friendsCount: 0,
  friendStatus: "none",
  busy: false,
};

/**
 * Premium mobile profile screen: large cover, overlapping avatar,
 * name, bio, stats, action button and Posts / Photos / Friends tabs.
 * Used by both the Profile tab and other-user profile pages.
 */
export function ProfileScreen({
  userId,
  isOwnProfile,
  onEditProfile,
  onOpenSettings,
  onOpenImageViewer,
  onOpenPost,
  onOpenChat,
  onOpenProfile,
}: ProfileScreenProps) {
  const { colors } = useTheme();
  const { user, profile: sessionProfile, refreshUnreadCounts } = useSession();
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [state, setState] = useState<ProfileState>(INITIAL_STATE);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const meId = (await supabase.auth.getUser()).data.user?.id;

    const [profileResult, countResult, friendsResult, photoResult, postResult, statusResult] = await Promise.all([
      profileService.getProfile(userId),
      postService.getPostCount(userId),
      friendService.getFriends(userId),
      postService.getPhotoPosts(userId, 30),
      postService.getUserPosts(userId, 0, 12),
      meId && !isOwnProfile ? friendService.getStatusWith(meId, userId) : Promise.resolve({ status: "none" as const, error: null }),
    ]);

    setState({
      loading: false,
      error: profileResult.error ?? countResult.error ?? friendsResult.error,
      profile: profileResult.profile,
      posts: postResult.posts,
      hasMorePosts: postResult.posts.length >= postService.PAGE_SIZE,
      photos: photoResult.posts,
      friends: friendsResult.friends,
      postsCount: countResult.count,
      friendsCount: friendsResult.friends.length,
      friendStatus: statusResult.status,
      busy: false,
    });
  }, [userId, isOwnProfile]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the own-profile header in sync after Edit Profile saves
  // (the tab stays mounted, so we mirror the session profile).
  useEffect(() => {
    if (isOwnProfile && sessionProfile) {
      setState((previous) => ({ ...previous, profile: sessionProfile }));
    }
  }, [isOwnProfile, sessionProfile]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  );

  const displayName = state.profile?.full_name?.trim() || state.profile?.username?.trim() || "SocialHub user";

  const runFriendAction = useCallback(
    async (action: () => Promise<{ error: string | null }>) => {
      if (!user || isOwnProfile) {
        return false;
      }
      setState((previous) => ({ ...previous, busy: true }));
      const { error } = await action();
      if (error) {
        Alert.alert("Couldn't update friend", error);
        setState((previous) => ({ ...previous, busy: false }));
        return false;
      }
      await load();
      await refreshUnreadCounts();
      return true;
    },
    [user, isOwnProfile, load, refreshUnreadCounts]
  );

  const toggleFriend = useCallback(async () => {
    if (!user || isOwnProfile) {
      return;
    }
    if (state.friendStatus === "accepted") {
      Alert.alert("Remove friend?", `Remove ${displayName} from your friends?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => runFriendAction(() => friendService.removeFriend(user.id, userId)),
        },
      ]);
      return;
    }
    if (state.friendStatus === "pending_incoming") {
      await runFriendAction(() => friendService.acceptRequest(user.id, userId));
      return;
    }
    if (state.friendStatus === "pending_outgoing") {
      await runFriendAction(() => friendService.cancelRequest(user.id, userId));
      return;
    }
    if (state.friendStatus === "blocked") {
      await runFriendAction(() => friendService.unblockUser(user.id, userId));
      return;
    }
    await runFriendAction(() => friendService.sendRequest(user.id, userId));
  }, [user, userId, isOwnProfile, state.friendStatus, displayName, runFriendAction]);

  const toggleBlock = useCallback(() => {
    if (!user || isOwnProfile) {
      return;
    }
    const isBlocked = state.friendStatus === "blocked";
    Alert.alert(
      isBlocked ? "Unblock user?" : "Block user?",
      isBlocked
        ? `${displayName} will be able to see your profile and send you friend requests again.`
        : `${displayName} won't be able to see your profile or interact with you. You can unblock them anytime.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isBlocked ? "Unblock" : "Block",
          style: isBlocked ? "default" : "destructive",
          onPress: () =>
            runFriendAction(() =>
              isBlocked ? friendService.unblockUser(user.id, userId) : friendService.blockUser(user.id, userId)
            ),
        },
      ]
    );
  }, [user, userId, isOwnProfile, state.friendStatus, displayName, runFriendAction]);

  const actionLabel = useMemo(() => {
    if (isOwnProfile) {
      return onEditProfile ? "Edit profile" : "Settings";
    }
    switch (state.friendStatus) {
      case "accepted":
        return "Friends";
      case "pending_incoming":
        return "Accept request";
      case "pending_outgoing":
        return "Requested";
      case "blocked":
        return "Unblock";
      default:
        return "Add friend";
    }
  }, [isOwnProfile, onEditProfile, state.friendStatus]);

  const actionHandler = isOwnProfile ? (onEditProfile ?? onOpenSettings) : toggleFriend;

  const shareProfile = useCallback(() => {
    const url = `https://friendbook-78z.pages.dev/profile/user-profile.html?user=${userId}`;
    const name = displayName;
    Share.share({
      message: `Check out ${name} on SocialHub: ${url}`,
      title: `Share ${name}'s profile`,
    }).catch(() => {
      // user dismissed the share sheet — nothing to do
    });
  }, [userId, displayName]);

  const aboutRows = useMemo<AboutRow[]>(() => {
    const profile = state.profile;
    if (!profile) {
      return [];
    }
    return (
      [
        { icon: "location-outline" as const, label: "Location", value: profile.location },
        { icon: "briefcase-outline" as const, label: "Work", value: profile.work },
        { icon: "school-outline" as const, label: "Education", value: profile.education },
        { icon: "globe-outline" as const, label: "Website", value: profile.website },
        { icon: "gift-outline" as const, label: "Birthday", value: profile.birthday },
      ] as AboutRow[]
    ).filter((row) => typeof row.value === "string" && row.value.trim().length > 0);
  }, [state.profile]);

  const toggleLikePost = useCallback(
    async (postId: string) => {
      if (!user) {
        return;
      }
      const post = state.posts.find((item) => item.id === postId);
      if (!post) {
        return;
      }
      const wasLiked = post.engagement.likedByMe;
      setState((previous) => ({
        ...previous,
        posts: previous.posts.map((item) =>
          item.id === postId
            ? {
                ...item,
                engagement: {
                  ...item.engagement,
                  likedByMe: !wasLiked,
                  likeCount: Math.max(0, item.engagement.likeCount + (wasLiked ? -1 : 1)),
                },
              }
            : item
        ),
      }));
      const { liked, error } = await postService.toggleLike(postId, user.id);
      if (error || liked === wasLiked) {
        setState((previous) => ({
          ...previous,
          posts: previous.posts.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  engagement: {
                    ...item.engagement,
                    likedByMe: wasLiked,
                    likeCount: Math.max(0, item.engagement.likeCount + (wasLiked ? 1 : -1)),
                  },
                }
              : item
          ),
        }));
      }
    },
    [user, state.posts]
  );

  const toggleSavePost = useCallback(
    async (postId: string) => {
      if (!user) {
        return;
      }
      const post = state.posts.find((item) => item.id === postId);
      if (!post) {
        return;
      }
      const wasSaved = post.engagement.savedByMe;
      setState((previous) => ({
        ...previous,
        posts: previous.posts.map((item) =>
          item.id === postId
            ? { ...item, engagement: { ...item.engagement, savedByMe: !wasSaved } }
            : item
        ),
      }));
      const { saved, error } = await postService.toggleSave(postId, user.id);
      if (error || saved === wasSaved) {
        setState((previous) => ({
          ...previous,
          posts: previous.posts.map((item) =>
            item.id === postId
              ? { ...item, engagement: { ...item.engagement, savedByMe: wasSaved } }
              : item
          ),
        }));
      }
    },
    [user, state.posts]
  );

  const header = (
    <View>
      {state.profile?.cover_url ? (
        <Image
          source={{ uri: state.profile.cover_url }}
          style={styles.cover}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={state.profile.cover_url}
        />
      ) : (
        <LinearGradient
          colors={[brand.gradientStart, brand.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cover}
        />
      )}

      <View style={styles.headerWrap}>
        <View style={[styles.avatarRing, { borderColor: colors.card, backgroundColor: colors.card }]}>
          <Avatar uri={state.profile?.avatar_url} name={displayName} size={88} />
        </View>

        <AppText level="heading" align="center" numberOfLines={1}>
          {displayName}
        </AppText>
        {state.profile?.username ? (
          <AppText level="caption" color="textMuted" align="center">
            @{state.profile.username}
          </AppText>
        ) : null}
        {state.profile?.bio ? (
          <AppText level="body" color="textSecondary" align="center" style={styles.bio}>
            {state.profile.bio}
          </AppText>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <AppText level="title">{state.postsCount}</AppText>
            <AppText level="caption" color="textMuted">Posts</AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <AppText level="title">{state.friendsCount}</AppText>
            <AppText level="caption" color="textMuted">Friends</AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.stat}>
            <AppText level="title">{state.photos.length}</AppText>
            <AppText level="caption" color="textMuted">Photos</AppText>
          </View>
        </View>

        {!isOwnProfile ? (
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              disabled={state.busy}
              onPress={actionHandler}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionPrimary,
                {
                  backgroundColor: state.friendStatus === "accepted" ? colors.inputBackground : colors.primary,
                  opacity: pressed || state.busy ? 0.7 : 1,
                },
              ]}
            >
              {state.busy ? (
                <ActivityIndicator color={state.friendStatus === "accepted" ? colors.primary : colors.onPrimary} size="small" />
              ) : (
                <AppText level="body" color={state.friendStatus === "accepted" ? "primary" : "white"} weight="700">
                  {actionLabel}
                </AppText>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send a message"
              disabled={state.busy}
              onPress={() => onOpenChat?.(userId)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionSecondary,
                {
                  borderColor: colors.primary,
                  opacity: pressed || state.busy ? 0.7 : 1,
                },
              ]}
            >
              <AppText level="body" color="primary" weight="700">
                Message
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`More options for ${displayName}`}
              disabled={state.busy}
              onPress={toggleBlock}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionSecondary,
                styles.actionIconOnly,
                {
                  borderColor: colors.border,
                  opacity: pressed || state.busy ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        {actionHandler && isOwnProfile ? (
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              disabled={state.busy}
              onPress={actionHandler}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionPrimary,
                {
                  backgroundColor: colors.primarySoft,
                  opacity: pressed || state.busy ? 0.7 : 1,
                },
              ]}
            >
              {state.busy ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <AppText level="body" color="primary" weight="700">
                  {actionLabel}
                </AppText>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share profile"
              disabled={state.busy}
              onPress={shareProfile}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionSecondary,
                {
                  borderColor: colors.border,
                  opacity: pressed || state.busy ? 0.7 : 1,
                },
              ]}
            >
              <AppText level="body" color="textMuted" weight="700">
                Share
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {isOwnProfile ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={onOpenSettings}
            style={({ pressed }) => [styles.settingsLink, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
            <AppText level="body" color="textMuted">Settings</AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.tabsRow, { borderColor: colors.border }]}>
        {(["posts", "about", "friends", "photos"] as ProfileTab[]).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            accessibilityLabel={`Show ${key}`}
            onPress={() => setTab(key)}
            style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}
          >
            <AppText
              level="body"
              weight="600"
              color={tab === key ? "primary" : "textMuted"}
              style={[styles.tabLabel, tab === key ? { borderBottomColor: colors.primary } : null]}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (state.loading && !state.profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (state.error && !state.profile) {
    return (
      <ErrorState
        message="Couldn't load this profile. Check your connection and try again."
        onRetry={load}
      />
    );
  }

  if (!state.profile) {
    return (
      <EmptyState
        icon="person-outline"
        title="Profile not found"
        description="This profile doesn't exist or was deactivated."
      />
    );
  }

  if (tab === "photos") {
    return (
      <FlatList
        key="photos"
        data={state.photos}
        numColumns={3}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        refreshControl={refreshControl}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View photo"
            onPress={() => {
              if (item.image_url && onOpenImageViewer) {
                onOpenImageViewer(item.image_url, "image");
              } else if (onOpenPost) {
                onOpenPost(item.id);
              }
            }}
            style={({ pressed }) => [styles.photoTileWrap, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Image
              source={{ uri: item.image_url! }}
              style={styles.photoTile}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.image_url!}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  if (tab === "about") {
    return (
      <FlatList
        key="about"
        data={aboutRows}
        keyExtractor={(item) => item.label}
        ListHeaderComponent={header}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <EmptyState
            icon="information-circle-outline"
            title="No personal details yet"
            description={isOwnProfile ? "Add your location, work, education or website from Edit profile." : undefined}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.aboutIconWrap, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.aboutTextWrap}>
              <AppText level="caption" color="textMuted">
                {item.label}
              </AppText>
              <AppText level="body" weight="600" numberOfLines={3}>
                {item.value}
              </AppText>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  if (tab === "friends") {
    return (
      <FlatList
        key="friends"
        data={state.friends}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        refreshControl={refreshControl}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${item.full_name ?? "user"}'s profile`}
            onPress={() => onOpenProfile?.(item.id)}
            style={({ pressed }) => [styles.friendRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Avatar uri={item.avatar_url} name={item.full_name} size={46} />
            <AppText level="body" weight="600" numberOfLines={1} style={styles.friendName}>
              {item.full_name?.trim() || "SocialHub user"}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      key="posts"
      data={state.posts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      renderItem={({ item }) => (
        <View style={styles.postWrap}>
          <PostCard
            post={item}
            onToggleLike={() => toggleLikePost(item.id)}
            onToggleSave={() => toggleSavePost(item.id)}
            onPressComment={() => onOpenPost?.(item.id)}
            onPressShare={() => undefined}
            onPressMedia={(uri, type) => onOpenImageViewer?.(uri, type)}
            onPressAuthor={() => {
              if (item.profiles?.id) {
                onOpenProfile?.(item.profiles.id);
              }
            }}
            onDelete={() => undefined}
          />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    height: 168,
    width: "100%",
  },
  headerWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  avatarRing: {
    marginTop: -44,
    borderRadius: 52,
    borderWidth: 4,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  bio: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    alignSelf: "stretch",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: "center",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignSelf: "stretch",
    paddingHorizontal: spacing.xl,
  },
  actionPrimary: {
    flex: 1,
  },
  actionSecondary: {
    flex: 1,
    borderWidth: 1.5,
  },
  actionIconOnly: {
    flex: 0,
    width: 48,
  },
  actionButton: {
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  tabsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  tabLabel: {
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  postWrap: {
    paddingHorizontal: spacing.md,
  },
  photoTileWrap: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
  },
  photoTile: {
    flex: 1,
    borderRadius: radius.small,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  friendName: {
    flex: 1,
  },
  aboutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aboutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutTextWrap: {
    flex: 1,
    minWidth: 0,
  },
});