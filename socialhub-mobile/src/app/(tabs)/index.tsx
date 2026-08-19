import { useCallback, useRef } from "react";
import { Alert, FlatList, RefreshControl, Share, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { useFeed } from "@/hooks/use-feed";
import { useStories } from "@/hooks/use-stories";
import { postService } from "@/services/postService";
import { AppHeader } from "@/components/navigation/app-header";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { StoriesRow } from "@/components/stories/stories-row";
import { CreatePostComposer } from "@/components/feed/create-post-composer";
import { PostCard } from "@/components/feed/post-card";
import { SkeletonFeed } from "@/components/ui/skeleton-post";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ActivityIndicator } from "react-native";
import type { FeedPost } from "@/types/database";

/**
 * Home screen (Step 2):
 * - Sticky SocialHub header
 * - Stories carousel (real data)
 * - Create post composer
 * - Real feed with pull-to-refresh + pagination
 *
 * Step 4: refreshes on focus (so new posts/stories appear after
 * returning from create/edit), a story action sheet, and media
 * viewers that handle both images and videos.
 */
export default function HomeScreen() {
  const { user, profile } = useSession();
  const { colors } = useTheme();
  const router = useRouter();
  const feed = useFeed(user?.id);
  const stories = useStories(user?.id);
  const firstFocus = useRef(true);

  // Refresh on every focus after the first (returning from create/edit
  // or a story should show the latest feed + stories).
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      feed.refresh();
      stories.reload();
    }, [feed, stories])
  );

  const openCreate = useCallback(() => router.push("/create"), [router]);

  const openStoryUser = useCallback(
    (userId: string) => {
      router.push({ pathname: "/story/[id]", params: { id: userId } });
    },
    [router]
  );

  const openStoryCreate = useCallback(() => {
    Alert.alert("Create", "What do you want to share?", [
      { text: "Photo story", onPress: () => router.push({ pathname: "/story/create", params: { mode: "photo" } }) },
      { text: "Video story", onPress: () => router.push({ pathname: "/story/create", params: { mode: "video" } }) },
      { text: "Text post", onPress: openCreate },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [router, openCreate]);

  const openPostDetail = useCallback(
    (postId: string, focusComment?: boolean) => {
      router.push({
        pathname: "/post/[id]",
        params: focusComment ? { id: postId, focusComment: "1" } : { id: postId },
      });
    },
    [router]
  );

  const openEditPost = useCallback(
    (postId: string) => {
      router.push({ pathname: "/post/edit", params: { id: postId } });
    },
    [router]
  );

  const openAuthor = useCallback(
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

  const handleShare = useCallback(async (post: FeedPost) => {
    try {
      const url = postService.getShareUrl(post);
      await Share.share({
        title: "SocialHub",
        message:
          url
            ? `${post.content?.trim() || "Check out this post on SocialHub!"}\n\n${url}`
            : post.content?.trim() || "Check out this post on SocialHub!",
      });
    } catch {
      // User dismissed the share sheet - nothing to do.
    }
  }, []);

  const handleDelete = useCallback(
    async (post: FeedPost) => {
      await postService.deletePost(post.id);
      feed.refresh();
    },
    [feed]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <PostCard
        post={item}
        onToggleLike={() => feed.toggleLike(item.id)}
        onToggleSave={() => feed.toggleSave(item.id)}
        onPressComment={() => openPostDetail(item.id, true)}
        onPressShare={() => handleShare(item)}
        onPressMedia={openImageViewer}
        onPressAuthor={() => openAuthor(item.user_id)}
        onDelete={() => handleDelete(item)}
        onEdit={() => openEditPost(item.id)}
      />
    ),
    [feed, openPostDetail, openImageViewer, openAuthor, handleShare, handleDelete, openEditPost]
  );

  const renderHeader = () => (
    <View>
      <StoriesRow
        feed={stories.feed}
        mySeenStoryIds={stories.mySeenStoryIds}
        myProfile={profile}
        onOpenUser={openStoryUser}
        onOpenMyStory={openStoryUser}
        onAddStory={openStoryCreate}
      />
      <View style={styles.composerWrap}>
        <CreatePostComposer profile={profile} onPress={openCreate} />
      </View>
    </View>
  );

  const renderFooter = () => {
    if (feed.loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (feed.posts.length > 0 && !feed.hasMore) {
      return (
        <View style={styles.footer}>
          <AppText level="body" color="textMuted">
            You're all caught up
          </AppText>
        </View>
      );
    }
    return null;
  };

  const renderBody = () => {
    if (feed.loading && feed.posts.length === 0) {
      return (
        <FlatList
          data={[1]}
          keyExtractor={() => "skeleton"}
          renderItem={() => (
            <View style={styles.skeletonWrap}>
              <SkeletonFeed />
            </View>
          )}
          ListHeaderComponent={renderHeader}
          scrollEnabled={false}
        />
      );
    }

    if (feed.error && feed.posts.length === 0) {
      return (
        <FlatList
          data={[1]}
          keyExtractor={() => "error"}
          renderItem={() => (
            <ErrorState
              message="Couldn't load your feed. Check your connection and try again."
              onRetry={feed.loadInitial}
            />
          )}
          ListHeaderComponent={renderHeader}
        />
      );
    }

    if (feed.posts.length === 0) {
      return (
        <FlatList
          data={[1]}
          keyExtractor={() => "empty"}
          renderItem={() => (
            <EmptyState
              icon="newspaper-outline"
              title="No posts yet"
              description="Posts from you and your friends will appear here."
              actionLabel="Create your first post"
              onAction={openCreate}
            />
          )}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={feed.refreshing}
              onRefresh={feed.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      );
    }

    return (
      <FlatList
        data={feed.posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.6}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    );
  };

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <AppHeader />
      <View style={styles.body}>{renderBody()}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  composerWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  skeletonWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
});