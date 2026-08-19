import { ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "@/constants/spacing";
import type { Profile } from "@/types/database";
import type { StoryFeedItem } from "@/services/storyService";
import { StoryItem } from "@/components/stories/story-item";

export interface StoriesRowProps {
  feed: StoryFeedItem[];
  mySeenStoryIds: Set<string>;
  myProfile: Profile | null;
  onOpenUser: (userId: string) => void;
  onOpenMyStory: (userId: string) => void;
  onAddStory: () => void;
}

function hasUnseen(item: StoryFeedItem, seenIds: Set<string>): boolean {
  return item.stories.some((story) => !seenIds.has(story.id));
}

/**
 * Horizontal stories carousel: "Your story" first, then friends'
 * stories sorted newest-first (unseen groups before fully-seen).
 * Your story ring opens your viewer when you have active stories,
 * otherwise it opens the create sheet.
 */
export function StoriesRow({ feed, mySeenStoryIds, myProfile, onOpenUser, onOpenMyStory, onAddStory }: StoriesRowProps) {
  const myStories = feed.find((item) => item.user.id === myProfile?.id);
  const hasMyStories = Boolean(myStories && myStories.stories.length > 0);
  const myUnseen = myStories ? hasUnseen(myStories, mySeenStoryIds) : false;

  const ordered = [...feed]
    .filter((item) => item.user.id !== myProfile?.id)
    .sort((a, b) => {
      const aUnseen = hasUnseen(a, mySeenStoryIds) ? 0 : 1;
      const bUnseen = hasUnseen(b, mySeenStoryIds) ? 0 : 1;
      if (aUnseen !== bUnseen) {
        return aUnseen - bUnseen;
      }
      const aNewest = Math.max(...a.stories.map((s) => new Date(s.created_at).getTime()));
      const bNewest = Math.max(...b.stories.map((s) => new Date(s.created_at).getTime()));
      return bNewest - aNewest;
    });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      <StoryItem
        uri={myProfile?.avatar_url}
        name={myProfile?.full_name}
        isMine
        seen={hasMyStories && !myUnseen}
        onPress={() => (hasMyStories && myProfile ? onOpenMyStory(myProfile.id) : onAddStory())}
      />

      {ordered.map((item) => (
        <StoryItem
          key={item.user.id}
          uri={item.user.avatar_url}
          name={item.user.full_name}
          seen={!hasUnseen(item, mySeenStoryIds)}
          onPress={() => onOpenUser(item.user.id)}
        />
      ))}

      <View style={styles.endCap} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  endCap: {
    width: spacing.sm,
  },
});