import { useCallback, useEffect, useState } from "react";

import { storyService, type StoryFeedItem } from "@/services/storyService";

interface StoriesState {
  feed: StoryFeedItem[];
  mySeenStoryIds: Set<string>;
  loading: boolean;
  error: string | null;
}

/**
 * Stories hook - fetches the active stories grouped by author,
 * plus which stories the current user has already seen.
 */
export function useStories(userId: string | undefined) {
  const [state, setState] = useState<StoriesState>({
    feed: [],
    mySeenStoryIds: new Set(),
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!userId) {
      setState({ feed: [], mySeenStoryIds: new Set(), loading: false, error: null });
      return;
    }
    const { feed, mySeenStoryIds, error } = await storyService.getActiveStories(userId);
    setState({ feed, mySeenStoryIds, loading: false, error });
  }, [userId]);

  const markSeen = useCallback((storyId: string) => {
    setState((previous) => {
      const next = new Set(previous.mySeenStoryIds);
      next.add(storyId);
      return { ...previous, mySeenStoryIds: next };
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    feed: state.feed,
    mySeenStoryIds: state.mySeenStoryIds,
    loading: state.loading,
    error: state.error,
    reload: load,
    markSeen,
  };
}