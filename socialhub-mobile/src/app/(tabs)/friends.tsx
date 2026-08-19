import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { friendService, type FriendSuggestion } from "@/services/friendService";
import { searchService, type SearchPerson } from "@/services/searchService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TabScreenTitle } from "@/components/common/tab-screen-title";
import { timeAgo } from "@/utils/time";
import type { Profile } from "@/types/database";

type FriendsTab = "requests" | "suggestions" | "friends";

const SEARCH_DEBOUNCE_MS = 350;

interface FriendsState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  requests: Awaited<ReturnType<typeof friendService.getIncomingRequests>>["requests"];
  suggestions: FriendSuggestion[];
  friends: Profile[];
  busyUserId: string | null;
}

/**
 * Friends screen: search on top, then Friend Requests /
 * Suggestions / Your Friends tabs. All data is real Supabase data.
 */
export default function FriendsScreen() {
  const { colors } = useTheme();
  const { user, refreshUnreadCounts } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<FriendsTab>("requests");
  const [state, setState] = useState<FriendsState>({
    loading: true,
    refreshing: false,
    error: null,
    requests: [],
    suggestions: [],
    friends: [],
    busyUserId: null,
  });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPerson[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const firstFocus = useRef(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setState((previous) => ({ ...previous, loading: true, error: null }));
    const [requestResult, friendsResult, suggestionsResult] = await Promise.all([
      friendService.getIncomingRequests(user.id),
      friendService.getFriends(user.id),
      friendService.getSuggestions(user.id, 12),
    ]);
    setState((previous) => ({
      ...previous,
      loading: false,
      error: requestResult.error ?? friendsResult.error ?? suggestionsResult.error,
      requests: requestResult.requests,
      friends: friendsResult.friends,
      suggestions: suggestionsResult.suggestions,
    }));
  }, [user]);

  const refresh = useCallback(async () => {
    setState((previous) => ({ ...previous, refreshing: true }));
    await load();
    await refreshUnreadCounts();
    setState((previous) => ({ ...previous, refreshing: false }));
  }, [load, refreshUnreadCounts]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );

  const runForUser = useCallback(async (userId: string, action: () => Promise<{ error: string | null }>) => {
    setState((previous) => ({ ...previous, busyUserId: userId }));
    const { error } = await action();
    setState((previous) => ({ ...previous, busyUserId: null }));
    if (error) {
      Alert.alert("Couldn't update friend", error);
      return false;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;
  }, []);

  const acceptRequest = useCallback(
    async (requesterId: string) => {
      const ok = await runForUser(requesterId, () => friendService.acceptRequest(user!.id, requesterId));
      if (ok) {
        await refresh();
      }
    },
    [runForUser, user, refresh]
  );

  const declineRequest = useCallback(
    async (requesterId: string) => {
      const ok = await runForUser(requesterId, () => friendService.declineRequest(user!.id, requesterId));
      if (ok) {
        await refresh();
      }
    },
    [runForUser, user, refresh]
  );

  const addFriend = useCallback(
    async (targetId: string) => {
      const ok = await runForUser(targetId, () => friendService.sendRequest(user!.id, targetId));
      if (ok) {
        setState((previous) => ({
          ...previous,
          suggestions: previous.suggestions.map((s) => (s.id === targetId ? { ...s, friendStatus: "pending_outgoing" } : s)),
        }));
        setResults((previous) => previous.map((r) => (r.id === targetId ? { ...r, friendStatus: "pending_outgoing" } : r)));
      }
    },
    [runForUser, user]
  );

  const hideSuggestion = useCallback((targetId: string) => {
    setState((previous) => ({
      ...previous,
      suggestions: previous.suggestions.filter((s) => s.id !== targetId),
    }));
  }, []);

  const removeFriend = useCallback(
    (target: Profile) => {
      Alert.alert("Remove friend?", `Remove ${target.full_name?.trim() || "this person"} from your friends?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const ok = await runForUser(target.id, () => friendService.removeFriend(user!.id, target.id));
            if (ok) {
              await refresh();
            }
          },
        },
      ]);
    },
    [runForUser, user, refresh]
  );

  const openProfile = useCallback(
    (userId: string) => {
      router.push({ pathname: "/profile/[id]", params: { id: userId } });
    },
    [router]
  );

  // Debounced inline search (friends tab).
  const runSearch = useCallback(
    async (value: string) => {
      if (!user) {
        return;
      }
      if (value.trim().length === 0) {
        setResults([]);
        setSearchError(null);
        return;
      }
      setSearching(true);
      setSearchError(null);
      const { people, error } = await searchService.searchPeople(value, user.id, 0, 10);
      setSearching(false);
      setResults(people);
      setSearchError(error);
    },
    [user]
  );

  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      searchTimer.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS);
    },
    [runSearch]
  );

  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  const renderPerson = useCallback(
    (person: Profile, meta?: string) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${person.full_name ?? "user"}'s profile`}
        onPress={() => openProfile(person.id)}
        style={({ pressed }) => [styles.personRow, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Avatar uri={person.avatar_url} name={person.full_name} size={48} />
        <View style={styles.personMeta}>
          <AppText level="body" weight="600" numberOfLines={1}>
            {person.full_name?.trim() || "SocialHub user"}
          </AppText>
          {person.username ? (
            <AppText level="caption" color="textMuted" numberOfLines={1}>
              @{person.username}
            </AppText>
          ) : null}
          {meta ? (
            <AppText level="caption" color="textMuted" numberOfLines={1}>
              {meta}
            </AppText>
          ) : null}
        </View>
      </Pressable>
    ),
    [openProfile]
  );

  const renderRequest = useCallback(
    (request: FriendsState["requests"][number]) => (
      <View key={request.friendship.id} style={styles.requestCard}>
        {renderPerson(request.profile, timeAgo(request.friendship.created_at))}
        <View style={styles.requestActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Accept friend request from ${request.profile.full_name ?? "user"}`}
            disabled={state.busyUserId === request.profile.id}
            onPress={() => acceptRequest(request.profile.id)}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.primary, opacity: pressed || state.busyUserId === request.profile.id ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
            <AppText level="body" weight="700" color="white">
              Accept
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decline friend request from ${request.profile.full_name ?? "user"}`}
            disabled={state.busyUserId === request.profile.id}
            onPress={() => declineRequest(request.profile.id)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.inputBackground,
                opacity: pressed || state.busyUserId === request.profile.id ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
            <AppText level="body" weight="600" color="textSecondary">
              Decline
            </AppText>
          </Pressable>
        </View>
      </View>
    ),
    [acceptRequest, declineRequest, renderPerson, state.busyUserId, colors]
  );

  const renderSuggestion = useCallback(
    (suggestion: FriendSuggestion) => (
      <View key={suggestion.id} style={styles.suggestionCard}>
        {renderPerson(
          suggestion,
          suggestion.mutualCount > 0 ? `${suggestion.mutualCount} mutual friend${suggestion.mutualCount === 1 ? "" : "s"}` : undefined
        )}
        <View style={styles.requestActions}>
          {suggestion.friendStatus === "pending_outgoing" ? (
            <View style={[styles.actionButton, { backgroundColor: colors.inputBackground }]}>
              <AppText level="body" weight="600" color="textMuted">
                Requested
              </AppText>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Send friend request to ${suggestion.full_name ?? "user"}`}
              disabled={state.busyUserId === suggestion.id}
              onPress={() => addFriend(suggestion.id)}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.primary, opacity: pressed || state.busyUserId === suggestion.id ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="person-add" size={16} color={colors.onPrimary} />
              <AppText level="body" weight="700" color="white">
                Add friend
              </AppText>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Hide suggestion ${suggestion.full_name ?? "user"}`}
            onPress={() => hideSuggestion(suggestion.id)}
            style={({ pressed }) => [styles.iconAction, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    ),
    [renderPerson, addFriend, hideSuggestion, state.busyUserId, colors]
  );

  const renderFriend = useCallback(
    (friend: Profile) => (
      <View key={friend.id} style={styles.friendRow}>
        {renderPerson(friend)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`More options for ${friend.full_name ?? "user"}`}
          onPress={() => removeFriend(friend)}
          style={({ pressed }) => [styles.iconAction, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    ),
    [renderPerson, removeFriend, colors]
  );

  const tabs = useMemo(
    () =>
      [
        { key: "requests" as const, label: `Requests${state.requests.length > 0 ? ` (${state.requests.length})` : ""}` },
        { key: "suggestions" as const, label: "Suggestions" },
        { key: "friends" as const, label: `Friends${state.friends.length > 0 ? ` (${state.friends.length})` : ""}` },
      ],
    [state.requests.length, state.friends.length]
  );

  const renderBody = () => {
    if (state.loading && state.friends.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }

    if (state.error && state.friends.length === 0) {
      return (
        <ErrorState
          message="Couldn't load your friends. Check your connection and try again."
          onRetry={load}
        />
      );
    }

    const refreshControl = (
      <RefreshControl
        refreshing={state.refreshing}
        onRefresh={refresh}
        tintColor={colors.primary}
        colors={[colors.primary]}
      />
    );

    if (tab === "requests") {
      return (
        <FlatList
          data={state.requests}
          keyExtractor={(item) => item.friendship.id}
          renderItem={({ item }) => renderRequest(item)}
          ListHeaderComponent={renderTabs}
          ListEmptyComponent={
            <EmptyState
              icon="person-add-outline"
              title="No friend requests"
              description="When someone sends you a request, it will appear here."
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (tab === "suggestions") {
      return (
        <FlatList
          data={state.suggestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderSuggestion(item)}
          ListHeaderComponent={renderTabs}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No suggestions right now"
              description="People you may know, based on your friends, will show up here."
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <FlatList
        data={state.friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderFriend(item)}
        ListHeaderComponent={renderTabs}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            description="Your friends will appear here once you connect."
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderTabs = () => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search people…"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={onQueryChange}
          accessibilityLabel="Search people"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => {
              setQuery("");
              setResults([]);
              setSearchError(null);
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {query.trim().length > 0 ? (
        <View style={styles.searchResults}>
          {searching ? (
            <ActivityIndicator color={colors.primary} style={styles.searchLoading} />
          ) : searchError ? (
            <AppText level="body" color="error">
              Couldn't complete your search.
            </AppText>
          ) : results.length === 0 ? (
            <AppText level="body" color="textMuted">
              No people found.
            </AppText>
          ) : (
            results.map((person) => (
              <Pressable
                key={person.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${person.full_name ?? "user"}'s profile`}
                onPress={() => openProfile(person.id)}
                style={({ pressed }) => [styles.searchRow, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Avatar uri={person.avatar_url} name={person.full_name} size={40} />
                <View style={styles.personMeta}>
                  <AppText level="body" weight="600" numberOfLines={1}>
                    {person.full_name?.trim() || "SocialHub user"}
                  </AppText>
                  {person.username ? (
                    <AppText level="caption" color="textMuted" numberOfLines={1}>
                      @{person.username}
                    </AppText>
                  ) : null}
                </View>
                <AppText level="caption" color="textMuted">
                  {person.friendStatus === "accepted"
                    ? "Friends"
                    : person.friendStatus === "pending_outgoing"
                      ? "Requested"
                      : person.friendStatus === "pending_incoming"
                        ? "Request received"
                        : ""}
                </AppText>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      <View style={styles.tabRow}>
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => setTab(item.key)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: active ? colors.primarySoft : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText level="body" weight="600" color={active ? "primary" : "textSecondary"}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <TabScreenTitle
        title="Friends"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open people search"
            onPress={() => router.push("/search")}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="search" size={22} color={colors.text} />
          </Pressable>
        }
      />
      {renderBody()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: spacing.md,
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
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  searchResults: {
    marginBottom: spacing.sm,
  },
  searchLoading: {
    paddingVertical: spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  personMeta: {
    flex: 1,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: "center",
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});