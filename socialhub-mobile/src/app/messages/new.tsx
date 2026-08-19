import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { searchService, type SearchPerson } from "@/services/searchService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * New conversation: search people and open (or reuse) the chat.
 * There is no conversation table - a chat is keyed by the user pair,
 * so opening an existing chat can never create a duplicate.
 */
export default function NewMessageScreen() {
  const { colors } = useTheme();
  const { user } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<SearchPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (value: string) => {
      if (!user) {
        return;
      }
      const trimmed = value.trim();
      if (trimmed === "") {
        setPeople([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const result = await searchService.searchPeople(trimmed, user.id, 0, 15);
      setLoading(false);
      setPeople(result.people);
      setError(result.error);
    },
    [user]
  );

  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS);
    },
    [runSearch]
  );

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const openChat = useCallback(
    (person: SearchPerson) => {
      router.replace({ pathname: "/messages/[id]", params: { id: person.id } });
    },
    [router]
  );

  const renderItem = ({ item }: { item: SearchPerson }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start a conversation with ${item.full_name ?? item.username ?? "user"}`}
      onPress={() => openChat(item)}
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
      <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
    </Pressable>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }

    if (query.trim() === "") {
      return (
        <EmptyState
          icon="person-add-outline"
          title="Find someone to message"
          description="Search by name or @username to start a conversation."
        />
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <AppText level="body" color="error">
            {error}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try the search again"
            onPress={() => runSearch(query)}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <AppText level="body" color="primary" weight="600">
              Try again
            </AppText>
          </Pressable>
        </View>
      );
    }

    if (people.length === 0) {
      return (
        <EmptyState icon="search-outline" title="No people found" description="Try a different name or @username." />
      );
    }

    return (
      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Screen edges={["left", "right", "bottom"]} padded={false}>
      <View style={styles.searchWrap}>
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
              onPress={() => {
                setQuery("");
                setPeople([]);
                setError(null);
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {renderBody()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    padding: spacing.md,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowBody: {
    flex: 1,
  },
});