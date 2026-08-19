import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { radius } from "@/constants/radius";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { searchService, type SearchPerson } from "@/services/searchService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search screen - finds people by name or username. Results are real
 * Supabase data, recent searches stay on-device (AsyncStorage).
 */
export default function SearchScreen() {
  const { colors } = useTheme();
  const { user } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<SearchPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [recents, setRecents] = useState<SearchPerson[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef(0);
  const queryRef = useRef("");

  const loadRecents = useCallback(async () => {
    if (!user) {
      return;
    }
    setRecents(await searchService.getRecent(user.id));
  }, [user]);

  useEffect(() => {
    loadRecents();
  }, [loadRecents]);

  const runSearch = useCallback(
    async (value: string, page = 0) => {
      if (!user) {
        return;
      }
      const trimmed = value.trim();
      if (trimmed === "") {
        setPeople([]);
        setHasMore(false);
        setError(null);
        pageRef.current = 0;
        return;
      }
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      const result = await searchService.searchPeople(trimmed, user.id, page, searchService.PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setHasMore(result.hasMore);
      if (page === 0) {
        setPeople(result.people);
      } else {
        setPeople((previous) => [...previous, ...result.people]);
      }
    },
    [user]
  );

  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      queryRef.current = value;
      pageRef.current = 0;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        runSearch(value, 0);
      }, SEARCH_DEBOUNCE_MS);
    },
    [runSearch]
  );

  const clearSearch = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setQuery("");
    queryRef.current = "";
    pageRef.current = 0;
    setPeople([]);
    setHasMore(false);
    setError(null);
    loadRecents();
  }, [loadRecents]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    runSearch(queryRef.current, nextPage);
  }, [runSearch]);

  const openPerson = useCallback(
    async (person: SearchPerson) => {
      if (user) {
        await searchService.saveRecent(user.id, person);
      }
      router.push({ pathname: "/profile/[id]", params: { id: person.id } });
    },
    [user, router]
  );

  const removeRecent = useCallback(
    async (personId: string) => {
      if (!user) {
        return;
      }
      await searchService.removeRecent(user.id, personId);
      setRecents((previous) => previous.filter((item) => item.id !== personId));
    },
    [user]
  );

  const clearRecents = useCallback(async () => {
    if (!user) {
      return;
    }
    await searchService.clearRecent(user.id);
    setRecents([]);
  }, [user]);

  const statusLabel = (person: SearchPerson): string => {
    switch (person.friendStatus) {
      case "accepted":
        return "Friends";
      case "pending_outgoing":
        return "Requested";
      case "pending_incoming":
        return "Request received";
      case "blocked":
        return "Blocked";
      default:
        return "";
    }
  };

  const renderPerson = ({ item }: { item: SearchPerson }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open profile of ${item.full_name ?? item.username ?? "user"}`}
      onPress={() => openPerson(item)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Avatar uri={item.avatar_url} name={item.full_name} size={48} />
      <View style={styles.rowBody}>
        <AppText level="body" weight="600" numberOfLines={1}>
          {item.full_name?.trim() || "SocialHub user"}
        </AppText>
        {item.username ? (
          <AppText level="caption" color="textMuted" numberOfLines={1}>
            @{item.username}
          </AppText>
        ) : null}
      </View>
      <AppText level="caption" color="textMuted">
        {statusLabel(item)}
      </AppText>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search people…"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={onQueryChange}
          autoFocus
          accessibilityLabel="Search people"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={clearSearch}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <AppText level="body" color="error">
            {error}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try the search again"
            onPress={() => runSearch(queryRef.current, 0)}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <AppText level="body" color="primary" weight="600">
              Try again
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const renderRecents = () => {
    if (recents.length === 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="Search people"
          description="Find people by name or @username."
        />
      );
    }
    return (
      <View style={styles.recentsSection}>
        <View style={styles.recentsHeader}>
          <AppText level="body" weight="700">
            Recent searches
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear recent searches"
            onPress={clearRecents}
            hitSlop={8}
          >
            <AppText level="body" color="primary" weight="600">
              Clear
            </AppText>
          </Pressable>
        </View>
        {recents.map((item) => (
          <View key={item.id} style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open profile of ${item.full_name ?? item.username ?? "user"}`}
              onPress={() => openPerson(item)}
              style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Avatar uri={item.avatar_url} name={item.full_name} size={44} />
              <View style={styles.rowBody}>
                <AppText level="body" weight="600" numberOfLines={1}>
                  {item.full_name?.trim() || "SocialHub user"}
                </AppText>
                {item.username ? (
                  <AppText level="caption" color="textMuted" numberOfLines={1}>
                    @{item.username}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.full_name ?? "user"} from recent searches`}
              onPress={() => removeRecent(item.id)}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  const renderBody = () => {
    if (query.trim() === "") {
      return <FlatList<SearchPerson>
        data={[]}
        keyExtractor={(item) => item.id}
        renderItem={() => null}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderRecents}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />;
    }

    if (loading) {
      return (
        <FlatList<SearchPerson>
          data={[]}
          keyExtractor={(item) => item.id}
          renderItem={() => null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        renderItem={renderPerson}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          error ? null : (
            <EmptyState
              icon="people-outline"
              title="No people found"
              description="Try a different name or @username."
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      {renderBody()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  recentsSection: {
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  recentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  rowBody: {
    flex: 1,
  },
});