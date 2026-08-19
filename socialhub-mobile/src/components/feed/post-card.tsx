import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { Card } from "@/components/ui/card";
import { AppText } from "@/components/ui/app-text";
import { UserIdentity } from "@/components/ui/user-identity";
import { PostActions, formatCount } from "@/components/feed/post-actions";
import { PostMenu } from "@/components/feed/post-menu";
import { timeAgo } from "@/utils/time";
import type { FeedPost } from "@/types/database";

export interface PostCardProps {
  post: FeedPost;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onPressComment: () => void;
  onPressShare: () => void;
  onPressMedia: (uri: string, type: "image" | "video") => void;
  onPressAuthor: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

const TEXT_COLLAPSE_THRESHOLD = 4;

function PostCardInner({
  post,
  onToggleLike,
  onToggleSave,
  onPressComment,
  onPressShare,
  onPressMedia,
  onPressAuthor,
  onDelete,
  onEdit,
}: PostCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [truncatable, setTruncatable] = useState(false);

  const author = post.profiles;
  const timestamp = timeAgo(post.created_at);

  const isOwnPost = useMemo(
    () => author?.id === post.user_id,
    [author, post.user_id]
  );

  const handleTextLayout = useCallback(
    (event: { nativeEvent: { lines: Array<{ text?: string }> } }) => {
      setTruncatable(event.nativeEvent.lines.length >= TEXT_COLLAPSE_THRESHOLD);
    },
    []
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <UserIdentity
          name={author?.full_name}
          username={author?.username}
          avatarUri={author?.avatar_url}
          avatarSize={44}
          meta={timestamp}
          onPress={onPressAuthor}
          style={styles.author}
        />
        <PostMenu
          isOwnPost={isOwnPost}
          savedByMe={post.engagement.savedByMe}
          onSaveToggle={onToggleSave}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </View>

      {post.content ? (
        <View style={styles.content}>
          <AppText
            level="body"
            numberOfLines={!expanded && truncatable ? TEXT_COLLAPSE_THRESHOLD : undefined}
            onTextLayout={handleTextLayout}
          >
            {post.content}
          </AppText>
          {truncatable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={expanded ? "Show less" : "Show more"}
              onPress={() => setExpanded((value) => !value)}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <AppText level="body" color="textMuted" weight="600">
                {expanded ? "See less" : "See more"}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {post.image_url ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View post photo"
          onPress={() => onPressMedia(post.image_url!, "image")}
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
        >
          <Image
            source={{ uri: post.image_url }}
            style={[styles.media, { backgroundColor: colors.skeleton, borderRadius: radius.medium }]}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
            recyclingKey={post.image_url}
          />
        </Pressable>
      ) : null}

      {post.video_url && !post.image_url ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play post video"
          onPress={() => onPressMedia(post.video_url!, "video")}
          style={({ pressed }) => [
            styles.videoBox,
            { backgroundColor: colors.skeleton, borderRadius: radius.medium, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Image
            source={{ uri: post.video_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`video-poster-${post.video_url}`}
          />
          <View style={[styles.playButton, { backgroundColor: colors.overlay }]}>
            <Ionicons name="play" size={28} color="#FFFFFF" />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.countsRow}>
        <AppText level="caption" color="textMuted">
          {formatCount(post.engagement.likeCount)} likes
        </AppText>
        <AppText level="caption" color="textMuted">
          {formatCount(post.engagement.commentCount)} comments
        </AppText>
      </View>

      <View style={[styles.actionsDivider, { backgroundColor: colors.divider }]} />

      <PostActions
        likeCount={post.engagement.likeCount}
        commentCount={post.engagement.commentCount}
        shareCount={post.engagement.shareCount}
        likedByMe={post.engagement.likedByMe}
        savedByMe={post.engagement.savedByMe}
        onLike={onToggleLike}
        onComment={onPressComment}
        onShare={onPressShare}
        onSave={onToggleSave}
      />

      {post.engagement.commentCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View comments"
          onPress={onPressComment}
          style={({ pressed }) => [styles.commentsPreview, { opacity: pressed ? 0.7 : 1 }]}
        >
          <AppText level="body" color="textSecondary">
            View {formatCount(post.engagement.commentCount)}{" "}
            {post.engagement.commentCount === 1 ? "comment" : "comments"}
          </AppText>
        </Pressable>
      ) : null}
    </Card>
  );
}

/**
 * Premium feed post card. Memoized - only re-renders when the
 * post's own engagement data changes.
 */
export const PostCard = memo(
  PostCardInner,
  (previous, next) =>
    previous.post.id === next.post.id &&
    previous.post.engagement.likeCount === next.post.engagement.likeCount &&
    previous.post.engagement.commentCount === next.post.engagement.commentCount &&
    previous.post.engagement.likedByMe === next.post.engagement.likedByMe &&
    previous.post.engagement.savedByMe === next.post.engagement.savedByMe
);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  media: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  videoBox: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  countsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  actionsDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  commentsPreview: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
});