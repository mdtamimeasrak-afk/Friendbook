import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Share, StyleSheet, TextInput, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { postService } from "@/services/postService";
import { commentService, type CommentWithProfile } from "@/services/commentService";
import { mediaService } from "@/services/mediaService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { PostCard } from "@/components/feed/post-card";
import { CommentItem } from "@/components/feed/comment-item";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import type { FeedPost } from "@/types/database";

interface PostDetailState {
  loading: boolean;
  error: string | null;
  post: FeedPost | null;
}

/**
 * Post detail screen: the full post + comments list + comment composer.
 * Comments paginate (20 at a time); new comments appear immediately and
 * the count stays in sync. Deleting your own comment/post is RLS-safe.
 */
export default function PostDetailScreen() {
  const { id, focusComment } = useLocalSearchParams<{ id?: string; focusComment?: string }>();
  const { user } = useSession();
  const router = useRouter();
  const { colors } = useTheme();

  const [state, setState] = useState<PostDetailState>({ loading: true, error: null, post: null });
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    if (!id) {
      setState({ loading: false, error: "Missing post.", post: null });
      return;
    }
    setState({ loading: true, error: null, post: null });
    const { post, error } = await postService.getPostById(String(id));
    setState({ loading: false, error, post });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // When arriving from a "comment" button, open the composer keyboard.
  useEffect(() => {
    if (focusComment === "1") {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [focusComment]);

  const loadComments = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!id) {
        return;
      }
      setCommentsError(null);
      if (!append) {
        setCommentsLoading(true);
      }
      const { comments: next, error } = await commentService.getComments(String(id), nextPage);
      if (error) {
        setCommentsError(error);
        setCommentsLoading(false);
        return;
      }
      setComments((previous) => (append ? [...previous, ...next] : next));
      setHasMoreComments(next.length >= commentService.PAGE_SIZE);
      setPage(nextPage);
      setCommentsLoading(false);
    },
    [id]
  );

  useEffect(() => {
    loadComments(0, false);
  }, [loadComments]);

  const openAuthor = useCallback(
    (userId: string) => {
      router.push({ pathname: "/profile/[id]", params: { id: userId } });
    },
    [router]
  );

  const openImageViewer = useCallback(
    (uri: string, type: "image" | "video") => {
      router.push({ pathname: "/viewer", params: { uri, type } });
    },
    [router]
  );

  const toggleLike = useCallback(async () => {
    const post = state.post;
    if (!user || !post) {
      return;
    }
    const wasLiked = post.engagement.likedByMe;
    setState((previous) =>
      previous.post
        ? {
            ...previous,
            post: {
              ...previous.post,
              engagement: {
                ...previous.post.engagement,
                likedByMe: !wasLiked,
                likeCount: Math.max(0, previous.post.engagement.likeCount + (wasLiked ? -1 : 1)),
              },
            },
          }
        : previous
    );
    const { liked, error } = await postService.toggleLike(post.id, user.id);
    if (error || liked === wasLiked) {
      setState((previous) =>
        previous.post
          ? {
              ...previous,
              post: {
                ...previous.post,
                engagement: {
                  ...previous.post.engagement,
                  likedByMe: wasLiked,
                  likeCount: Math.max(0, previous.post.engagement.likeCount + (wasLiked ? 1 : -1)),
                },
              },
            }
          : previous
      );
    }
  }, [user, state.post]);

  const toggleSave = useCallback(async () => {
    const post = state.post;
    if (!user || !post) {
      return;
    }
    const wasSaved = post.engagement.savedByMe;
    setState((previous) =>
      previous.post
        ? {
            ...previous,
            post: {
              ...previous.post,
              engagement: { ...previous.post.engagement, savedByMe: !wasSaved },
            },
          }
        : previous
    );
    const { saved, error } = await postService.toggleSave(post.id, user.id);
    if (error || saved === wasSaved) {
      setState((previous) =>
        previous.post
          ? {
              ...previous,
              post: {
                ...previous.post,
                engagement: { ...previous.post.engagement, savedByMe: wasSaved },
              },
            }
          : previous
      );
    }
  }, [user, state.post]);

  const sharePost = useCallback(async () => {
    const post = state.post;
    if (!post) {
      return;
    }
    const url = postService.getShareUrl(post);
    try {
      await Share.share({
        title: "SocialHub",
        message:
          url
            ? `${post.content?.trim() || "Check out this post on SocialHub!"}\n\n${url}`
            : post.content?.trim() || "Check out this post on SocialHub!",
      });
    } catch {
      // User dismissed the share sheet.
    }
  }, [state.post]);

  const addComment = useCallback(async () => {
    const post = state.post;
    const text = draft.trim();
    if (!user || !post || !text || sending) {
      return;
    }
    setSending(true);
    const { comment, error } = await commentService.createComment(post.id, user.id, text);
    setSending(false);
    if (error || !comment) {
      Alert.alert("Couldn't comment", error ?? "Please try again.");
      return;
    }
    setDraft("");
    setComments((previous) => [comment, ...previous]);
    setState((previous) =>
      previous.post
        ? {
            ...previous,
            post: {
              ...previous.post,
              engagement: {
                ...previous.post.engagement,
                commentCount: previous.post.engagement.commentCount + 1,
              },
            },
          }
        : previous
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [user, state.post, draft, sending]);

  const deleteComment = useCallback(
    (comment: CommentWithProfile) => {
      Alert.alert("Delete comment?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await commentService.deleteComment(comment.id);
            if (error) {
              Alert.alert("Couldn't delete", error);
              return;
            }
            setComments((previous) => previous.filter((item) => item.id !== comment.id));
            setState((previous) =>
              previous.post
                ? {
                    ...previous,
                    post: {
                      ...previous.post,
                      engagement: {
                        ...previous.post.engagement,
                        commentCount: Math.max(0, previous.post.engagement.commentCount - 1),
                      },
                    },
                  }
                : previous
            );
          },
        },
      ]);
    },
    []
  );

  const deletePost = useCallback(async () => {
    const post = state.post;
    if (!post) {
      return;
    }
    Alert.alert("Delete this post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Clean up media first (best-effort), then remove the post row.
          if (post.image_url) {
            await mediaService.deleteByPublicUrl(post.image_url, "post-images");
          }
          if (post.video_url) {
            await mediaService.deleteByPublicUrl(post.video_url, "videos");
          }
          const { error } = await postService.deletePost(post.id);
          if (error) {
            Alert.alert("Couldn't delete", error);
            return;
          }
          router.replace("/");
        },
      },
    ]);
  }, [state.post, router]);

  const loadMoreComments = useCallback(() => {
    if (hasMoreComments && !commentsLoading) {
      loadComments(page + 1, true);
    }
  }, [hasMoreComments, commentsLoading, loadComments, page]);

  const commentInput = useMemo(
    () => (
      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          ref={inputRef}
          style={[styles.composerInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
          placeholder="Write a comment…"
          placeholderTextColor={colors.placeholder}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={1000}
          accessibilityLabel="Write a comment"
          onSubmitEditing={addComment}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send comment"
          disabled={sending || draft.trim().length === 0}
          onPress={addComment}
          style={({ pressed }) => [styles.sendButton, { opacity: pressed || sending || draft.trim().length === 0 ? 0.5 : 1 }]}
        >
          <Ionicons name="arrow-up-circle" size={34} color={colors.primary} />
        </Pressable>
      </View>
    ),
    [colors, draft, sending, addComment]
  );

  if (state.loading) {
    return (
      <Screen edges={["left", "right", "bottom"]} padded={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (state.error || !state.post) {
    return (
      <Screen edges={["left", "right", "bottom"]} padded={false}>
        <Header />
        <ErrorState message="This post could not be loaded." onRetry={load} />
      </Screen>
    );
  }

  const post = state.post;
  const isOwnPost = post.user_id === user?.id;

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <Header />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <PostCard
                post={post}
                onToggleLike={toggleLike}
                onToggleSave={toggleSave}
                onPressComment={() => inputRef.current?.focus()}
                onPressShare={sharePost}
                onPressMedia={openImageViewer}
                onPressAuthor={() => openAuthor(post.user_id)}
                onDelete={deletePost}
                onEdit={() => router.push({ pathname: "/post/edit", params: { id: post.id } })}
              />
              <AppText level="title" style={styles.commentsTitle}>
                Comments
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              isMine={item.user_id === user?.id}
              onPressAuthor={() => openAuthor(item.user_id)}
              onDelete={() => deleteComment(item)}
            />
          )}
          ListEmptyComponent={
            commentsLoading ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : commentsError ? (
              <ErrorState message="Couldn't load comments." onRetry={() => loadComments(0, false)} />
            ) : (
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="No comments yet"
                description="Be the first to comment."
              />
            )
          }
          ListFooterComponent={
            hasMoreComments ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Load more comments"
                onPress={loadMoreComments}
                style={({ pressed }) => [styles.loadMore, { opacity: pressed ? 0.6 : 1 }]}
              >
                <AppText level="body" color="primary" weight="600">
                  Load more comments
                </AppText>
              </Pressable>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
        {commentInput}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Header() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText level="heading">Post</AppText>
      <View style={styles.headerSpacer} />
    </View>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  commentsTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  commentsLoading: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  loadMore: {
    alignItems: "center",
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  sendButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});