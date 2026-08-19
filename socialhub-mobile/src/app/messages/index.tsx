import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { messageService, type Conversation } from "@/services/messageService";
import { pushService } from "@/services/pushService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { ConversationItem } from "@/components/messages/conversation-item";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { timeAgo } from "@/utils/time";

interface ConversationsState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  conversations: Conversation[];
}

function lastMessagePreview(message: Conversation["lastMessage"]): string {
  if (message.media_url) {
    return "Photo";
  }
  const content = message.content?.trim();
  if (!content) {
    return "Sent a message";
  }
  return content;
}

/**
 * Conversation list (Messages). Conversations are derived from the
 * sender/receiver pair - sorted by most recent activity. Refreshes on
 * focus, pull-to-refresh, and live new-message events.
 */
export default function MessagesIndexScreen() {
  const { colors } = useTheme();
  const { user, onlineUserIds, messagesVersion } = useSession();
  const router = useRouter();

  const [state, setState] = useState<ConversationsState>({ loading: true, refreshing: false, error: null, conversations: [] });
  const [query, setQuery] = useState("");
  const firstFocus = useRef(true);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    const { conversations, error } = await messageService.getConversations(user.id);
    setState((previous) => ({ ...previous, loading: false, error, conversations }));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch when a live new-message event arrives.
  useEffect(() => {
    if (messagesVersion > 0) {
      load();
    }
  }, [messagesVersion, load]);

  const refresh = useCallback(async () => {
    setState((previous) => ({ ...previous, refreshing: true }));
    await load();
    setState((previous) => ({ ...previous, refreshing: false }));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        // Step 7: notification permission at a meaningful moment -
        // the user opened their messages.
        pushService.requestPermissionIfNeeded().catch(() => {
          // Best-effort.
        });
        return;
      }
      refresh();
    }, [refresh])
  );

  const openConversation = useCallback(
    (otherUserId: string) => {
      router.push({ pathname: "/messages/[id]", params: { id: otherUserId } });
    },
    [router]
  );

  const openNewConversation = useCallback(() => {
    router.push("/messages/new");
  }, [router]);

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (clean === "") {
      return state.conversations;
    }
    return state.conversations.filter((conversation) => {
      const name = conversation.otherUser.full_name?.toLowerCase() ?? "";
      const username = conversation.otherUser.username?.toLowerCase() ?? "";
      return name.includes(clean) || username.includes(clean);
    });
  }, [state.conversations, query]);

  const renderItem = ({ item }: { item: Conversation }) => {
    const name = item.otherUser.full_name?.trim() || item.otherUser.username?.trim() || "User";

    return (
      <ConversationItem
        avatarUrl={item.otherUser.avatar_url}
        name={name}
        lastMessage={lastMessagePreview(item.lastMessage)}
        timeLabel={timeAgo(item.lastMessage.created_at)}
        unreadCount={item.unreadCount}
        online={onlineUserIds.has(item.otherUser.id)}
        onPress={() => openConversation(item.otherUser.id)}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <AppText level="heading">Messages</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start a new conversation"
        onPress={openNewConversation}
        style={({ pressed }) => [
          styles.newButton,
          { backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Ionicons name="square-outline" size={17} color={colors.primary} />
        <AppText level="body" color="primary" weight="700">
          New
        </AppText>
      </Pressable>
    </View>
  );

  const renderSearch = () => (
    <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search conversations…"
        placeholderTextColor={colors.placeholder}
        value={query}
        onChangeText={setQuery}
        accessibilityLabel="Search conversations"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {query.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear conversation search"
          onPress={() => setQuery("")}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  const renderBody = () => {
    if (state.loading && state.conversations.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }

    if (state.error && state.conversations.length === 0) {
      return (
        <ErrorState message="Couldn't load your messages. Check your connection and try again." onRetry={load} />
      );
    }

    if (state.conversations.length === 0) {
      return (
        <View style={styles.listContent}>
          {renderSearch()}
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            description="When you message someone, your conversations will show up here."
            actionLabel="Start a conversation"
            onAction={openNewConversation}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.otherUser.id}
        renderItem={renderItem}
        ListHeaderComponent={renderSearch}
        ListEmptyComponent={
          query.trim() !== "" ? (
            <EmptyState icon="search-outline" title="No conversations found" description="Try a different name." />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Screen edges={["top", "left", "right", "bottom"]} padded={false}>
      {renderHeader()}
      {renderBody()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
});