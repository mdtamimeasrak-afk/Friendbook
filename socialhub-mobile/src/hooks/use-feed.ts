import { useCallback, useEffect, useRef, useState } from "react";

import { postService } from "@/services/postService";
import type { FeedPost } from "@/types/database";

interface FeedState {
  posts: FeedPost[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

const INITIAL_STATE: FeedState = {
  posts: [],
  loading: true,
  refreshing: false,
  loadingMore: false,
  hasMore: true,
  error: null,
};

/**
 * Feed hook - keeps data fetching separate from presentation.
 * Supports initial load, pull-to-refresh, offset pagination,
 * and optimistic like/save with rollback.
 */
export function useFeed(userId: string | undefined) {
  const [state, setState] = useState<FeedState>(INITIAL_STATE);
  const pageRef = useRef(0);
  const busyRef = useRef(false);

  const applyPosts = useCallback((posts: FeedPost[]) => {
    setState((previous) => ({ ...previous, posts }));
  }, []);

  const loadInitial = useCallback(async () => {
    busyRef.current = true;
    pageRef.current = 0;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const { posts, error } = await postService.getFeedPosts(0);
    busyRef.current = false;
    if (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error,
      }));
      return;
    }
    setState((previous) => ({
      ...previous,
      posts,
      loading: false,
      refreshing: false,
      hasMore: posts.length >= postService.PAGE_SIZE,
      error: null,
    }));
  }, []);

  const refresh = useCallback(async () => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setState((previous) => ({ ...previous, refreshing: true, error: null }));
    const { posts, error } = await postService.getFeedPosts(0);
    busyRef.current = false;
    if (error) {
      setState((previous) => ({ ...previous, refreshing: false, error }));
      return;
    }
    pageRef.current = 0;
    setState((previous) => ({
      ...previous,
      posts,
      refreshing: false,
      hasMore: posts.length >= postService.PAGE_SIZE,
      error: null,
    }));
  }, []);

  const loadMore = useCallback(async () => {
    if (busyRef.current || state.loadingMore || !state.hasMore || state.posts.length === 0) {
      return;
    }
    busyRef.current = true;
    setState((previous) => ({ ...previous, loadingMore: true }));
    const nextPage = pageRef.current + 1;
    const { posts, error } = await postService.getFeedPosts(nextPage);
    busyRef.current = false;
    if (error) {
      setState((previous) => ({ ...previous, loadingMore: false }));
      return;
    }
    pageRef.current = nextPage;
    setState((previous) => ({
      ...previous,
      posts: [...previous.posts, ...posts],
      loadingMore: false,
      hasMore: posts.length >= postService.PAGE_SIZE,
      error: null,
    }));
  }, [state.loadingMore, state.hasMore, state.posts.length]);

  /** Optimistic like toggle - reverts on failure. */
  const toggleLike = useCallback(
    async (postId: string) => {
      if (!userId) {
        return;
      }
      const post = state.posts.find((item) => item.id === postId);
      if (!post) {
        return;
      }
      const wasLiked = post.engagement.likedByMe;
      applyPosts(
        state.posts.map((item) =>
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
        )
      );
      const { liked, error } = await postService.toggleLike(postId, userId);
      if (error || liked === wasLiked) {
        applyPosts(
          state.posts.map((item) =>
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
          )
        );
      }
    },
    [userId, state.posts, applyPosts]
  );

  /** Optimistic save toggle - reverts on failure. */
  const toggleSave = useCallback(
    async (postId: string) => {
      if (!userId) {
        return;
      }
      const post = state.posts.find((item) => item.id === postId);
      if (!post) {
        return;
      }
      const wasSaved = post.engagement.savedByMe;
      applyPosts(
        state.posts.map((item) =>
          item.id === postId
            ? { ...item, engagement: { ...item.engagement, savedByMe: !wasSaved } }
            : item
        )
      );
      const { saved, error } = await postService.toggleSave(postId, userId);
      if (error || saved === wasSaved) {
        applyPosts(
          state.posts.map((item) =>
            item.id === postId
              ? { ...item, engagement: { ...item.engagement, savedByMe: wasSaved } }
              : item
          )
        );
      }
    },
    [userId, state.posts, applyPosts]
  );

  useEffect(() => {
    if (userId) {
      loadInitial();
    }
  }, [userId, loadInitial]);

  return {
    posts: state.posts,
    loading: state.loading,
    refreshing: state.refreshing,
    loadingMore: state.loadingMore,
    hasMore: state.hasMore,
    error: state.error,
    loadInitial,
    refresh,
    loadMore,
    toggleLike,
    toggleSave,
  };
}