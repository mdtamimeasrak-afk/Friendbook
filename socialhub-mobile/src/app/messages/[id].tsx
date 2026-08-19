import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type AlertButton,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius } from "@/constants/radius";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/theme";
import { useSession } from "@/context/session";
import { messageService } from "@/services/messageService";
import { presenceService } from "@/services/presenceService";
import { pushService } from "@/services/pushService";
import { profileService } from "@/services/profileService";
import { mediaService } from "@/services/mediaService";
import { Screen } from "@/components/ui/screen";
import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import type { Message, Profile } from "@/types/database";

type ClientStatus = "sending" | "failed";

interface ChatMessage extends Message {
  clientStatus?: ClientStatus;
}

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘",
  "😎", "🤔", "😅", "😉", "🙃", "😢", "😭", "😡",
  "👍", "👎", "👏", "🙏", "💪", "🤝", "❤️", "💔",
  "💯", "🔥", "✨", "🎉", "🎂", "🚀", "👀", "😴",
];

function chatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday.getTime() - startDay.getTime()) / 86400000);
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function lastSeenLabel(lastSeen: string | null): string {
  if (!lastSeen) {
    return "Active recently";
  }
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 60000) {
    return "Active now";
  }
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return `Last active ${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Last active ${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Last active yesterday";
  }
  return `Last active ${days}d ago`;
}

/**
 * One-to-one chat screen (messages/[id]).
 * Real-time delivery via postgres_changes, typing + online via
 * Realtime channels, optimistic sends with retry, images, replies.
 */
export default function ChatScreen() {
  const { id: otherId } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user, onlineUserIds, refreshUnreadCounts } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [preview, setPreview] = useState<{ uri: string; mimeType: string | null } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [offline, setOffline] = useState(false);
  const [replyCache, setReplyCache] = useState<Map<string, Message>>(new Map());
  const [nearBottom, setNearBottom] = useState(true);

  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oldestTimestamp = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const meId = user?.id;
  const isOnline = Boolean(otherId && onlineUserIds.has(otherId));

  // Step 7: suppress push notifications for the chat that is open.
  useEffect(() => {
    if (!otherId) {
      return;
    }
    pushService.setActiveChatUserId(otherId);
    return () => pushService.setActiveChatUserId(null);
  }, [otherId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ---- Initial load: profile + first message batch + mark read ----
  useEffect(() => {
    if (!meId || !otherId) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const [profileResult, pageResult] = await Promise.all([
        profileService.getProfile(otherId),
        messageService.getChatPage(meId, otherId, messageService.PAGE_SIZE),
      ]);
      if (cancelled) {
        return;
      }
      setProfile(profileResult.profile);
      setMessages(pageResult.messages);
      setHasMore(pageResult.hasMore);
      oldestTimestamp.current = pageResult.messages[0]?.created_at ?? null;
      setError(profileResult.error ?? pageResult.error);
      setLoading(false);

      const incoming = pageResult.messages.filter((m) => m.sender_id === otherId && !m.read);
      if (incoming.length > 0) {
        await messageService.markConversationRead(meId, otherId);
        refreshUnreadCounts();
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [meId, otherId, refreshUnreadCounts]);

  // ---- Realtime subscription (INSERT/UPDATE/DELETE, conversation-scoped) ----
  useEffect(() => {
    if (!meId || !otherId) {
      return;
    }
    const unsubscribe = messageService.subscribeConversation(meId, otherId, (event) => {
      const { eventType, message } = event;
      if (eventType === "DELETE") {
        setMessages((previous) => previous.filter((m) => m.id !== message.id));
        return;
      }
      if (eventType === "UPDATE") {
        setMessages((previous) =>
          previous.map((m) => (m.id === message.id ? { ...m, ...message } : m))
        );
        return;
      }
      // INSERT: dedupe by message id (realtime + optimistic overlap).
      setMessages((previous) => {
        if (previous.some((m) => m.id === message.id)) {
          return previous;
        }
        const mine = message.sender_id === meId;
        const next = [...previous, message as ChatMessage].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        if (!mine) {
          if (nearBottom) {
            messageService.markConversationRead(meId, otherId);
            refreshUnreadCounts();
          } else {
            setShowNewMessages(true);
          }
        }
        return next;
      });
    });
    return () => unsubscribe();
  }, [meId, otherId, nearBottom, refreshUnreadCounts]);

  // ---- Typing subscription ----
  useEffect(() => {
    if (!meId || !otherId) {
      return;
    }
    const unsubscribe = presenceService.subscribeTyping(meId, otherId, () => {
      setTyping(true);
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      typingTimer.current = setTimeout(() => setTyping(false), presenceService.TYPING_VISIBLE_MS);
    });
    return () => {
      unsubscribe();
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, [meId, otherId]);

  // ---- Connectivity ----
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  // ---- Resolve unknown reply references (bounded) ----
  useEffect(() => {
    const missing = new Set<string>();
    messages.forEach((message) => {
      if (message.reply_to && !replyCache.has(message.reply_to) && !messages.some((m) => m.id === message.reply_to)) {
        missing.add(message.reply_to);
      }
    });
    const ids = [...missing];
    if (ids.length === 0) {
      return;
    }
    ids.slice(0, 10).forEach(async (replyToId) => {
      const { message } = await messageService.getMessage(replyToId);
      if (message) {
        setReplyCache((previous) => {
          const next = new Map(previous);
          next.set(replyToId, message);
          return next;
        });
      }
    });
  }, [messages, replyCache]);

  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  const statusSubtitle = () => {
    if (typing) {
      return `${profile?.full_name?.split(" ")[0] ?? "User"} is typing…`;
    }
    if (isOnline) {
      return "Active now";
    }
    return lastSeenLabel(profile?.last_seen ?? null);
  };

  const sendText = useCallback(
    async (content: string, mediaUrl: string | null, targetReply: Message | null) => {
      if (!meId || !otherId || !content.trim() && !mediaUrl) {
        return;
      }
      const clientId = Crypto.randomUUID();
      const optimistic: ChatMessage = {
        id: clientId,
        sender_id: meId,
        receiver_id: otherId,
        content: mediaUrl ? "" : content.trim(),
        read: false,
        read_at: null,
        media_url: mediaUrl,
        reply_to: targetReply?.id ?? null,
        created_at: new Date().toISOString(),
        clientStatus: "sending",
      };
      setMessages((previous) => [...previous, optimistic]);

      const { message, error: sendError } = await messageService.sendMessage(
        meId,
        otherId,
        mediaUrl ? "" : content.trim(),
        mediaUrl,
        targetReply?.id ?? null
      );

      if (sendError && !/duplicate/i.test(sendError)) {
        setMessages((previous) =>
          previous.map((m) => (m.id === clientId ? { ...m, clientStatus: "failed" } : m))
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (message) {
        // Replace the optimistic row; also drop the realtime-delivered
        // copy of the same server message (dedupe by id).
        setMessages((previous) =>
          [...previous.filter((m) => m.id !== clientId && m.id !== message.id), message].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        );
      } else if (sendError && /duplicate/i.test(sendError)) {
        // First attempt actually succeeded - recover the row.
        const { message: existing } = await messageService.getMessage(clientId);
        if (existing) {
          setMessages((previous) =>
            [...previous.filter((m) => m.id !== clientId && m.id !== existing.id), existing].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          );
        }
      }
    },
    [meId, otherId]
  );

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (sending || (!content && !preview)) {
      return;
    }
    if (preview) {
      setSending(true);
      setUploadingMedia(true);
      setShowEmoji(false);
      messageService.uploadChatImage(preview.uri, meId!).then(async ({ url, error: uploadError }) => {
        setUploadingMedia(false);
        if (uploadError || !url) {
          Alert.alert("Couldn't send photo", uploadError ?? "Upload failed.");
          setSending(false);
          return;
        }
        await sendText("", url, replyTo);
        setSending(false);
        setPreview(null);
        setReplyTo(null);
        setInput("");
      });
      return;
    }
    setSending(true);
    setShowEmoji(false);
    const targetReply = replyTo;
    setInput("");
    setReplyTo(null);
    sendText(content, null, targetReply).finally(() => setSending(false));
  }, [input, sending, preview, replyTo, sendText, meId]);

  const retryMessage = useCallback(
    (message: ChatMessage) => {
      Haptics.selectionAsync();
      setMessages((previous) => previous.filter((m) => m.id !== message.id));
      const targetReply = message.reply_to ? replyCache.get(message.reply_to) ?? null : null;
      sendText(message.content, message.media_url, targetReply);
    },
    [sendText, replyCache]
  );

  const pickImage = useCallback(async () => {
    if (uploadingMedia || sending) {
      return;
    }
    const { media, error: pickError } = await mediaService.pickImage();
    if (pickError) {
      Alert.alert("Couldn't pick image", pickError);
      return;
    }
    if (media) {
      setPreview({ uri: media.uri, mimeType: media.mimeType });
      setShowEmoji(false);
    }
  }, [uploadingMedia, sending]);

  const markReadNow = useCallback(async () => {
    if (!meId || !otherId) {
      return;
    }
    setShowNewMessages(false);
    setNearBottom(true);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    await messageService.markConversationRead(meId, otherId);
    refreshUnreadCounts();
  }, [meId, otherId, refreshUnreadCounts]);

  const loadOlder = useCallback(async () => {
    if (!meId || !otherId || loadingOlder || !hasMore || !oldestTimestamp.current) {
      return;
    }
    setLoadingOlder(true);
    const { messages: older, hasMore: more } = await messageService.getOlderMessages(
      meId,
      otherId,
      oldestTimestamp.current,
      messageService.PAGE_SIZE
    );
    setLoadingOlder(false);
    if (older.length > 0) {
      oldestTimestamp.current = older[0].created_at;
      setMessages((previous) => {
        const known = new Set(previous.map((m) => m.id));
        return [...previous, ...older.filter((m) => !known.has(m.id))].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    }
    setHasMore(more);
  }, [meId, otherId, loadingOlder, hasMore]);

  const scrollToMessage = useCallback(
    async (targetId: string) => {
      const current = messagesRef.current;
      const index = current.findIndex((m) => m.id === targetId);
      if (index !== -1) {
        listRef.current?.scrollToIndex({
          index: current.length - 1 - index,
          viewPosition: 0.4,
          animated: true,
        });
        return;
      }
      // Not loaded yet - fetch older pages until found (bounded).
      let cursor = oldestTimestamp.current;
      for (let attempt = 0; attempt < 5 && cursor; attempt++) {
        const { messages: older, hasMore: more } = await messageService.getOlderMessages(
          meId!,
          otherId!,
          cursor,
          messageService.PAGE_SIZE
        );
        if (older.length === 0) {
          break;
        }
        const known = new Set(messagesRef.current.map((m) => m.id));
        const fresh = older.filter((m) => !known.has(m.id));
        setMessages((previous) =>
          [...previous, ...fresh].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        );
        oldestTimestamp.current = older[0].created_at;
        const found = older.find((m) => m.id === targetId);
        if (found) {
          const ascendingIndex = older.indexOf(found);
          const targetIndex = older.length - 1 - ascendingIndex;
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: targetIndex,
              viewPosition: 0.4,
              animated: true,
            });
          }, 150);
          return;
        }
        cursor = older[0].created_at;
        if (!more) {
          break;
        }
      }
      Alert.alert("Message not found", "This message is too old to scroll to.");
    },
    [meId, otherId]
  );

  const openMessageMenu = useCallback(
    (message: ChatMessage) => {
      const mine = message.sender_id === meId;
      const actions: AlertButton[] = [
        {
          text: "Reply",
          onPress: () => {
            Haptics.selectionAsync();
            setReplyTo(message);
            setShowEmoji(false);
          },
        },
      ];
      if (message.content?.trim()) {
        actions.push({
          text: "Copy",
          onPress: () => {
            Clipboard.setStringAsync(message.content).catch(() => {});
            Haptics.selectionAsync();
          },
        });
      }
      if (mine && message.clientStatus === "failed") {
        actions.push({ text: "Retry", onPress: () => retryMessage(message) });
      }
      if (mine) {
        actions.push({
          text: "Delete",
          style: "destructive" as const,
          onPress: () => {
            Alert.alert("Delete message?", "This removes the message for both of you.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  if (message.clientStatus === "failed") {
                    setMessages((previous) => previous.filter((m) => m.id !== message.id));
                    return;
                  }
                  setMessages((previous) => previous.filter((m) => m.id !== message.id));
                  await messageService.deleteMessage(message.id);
                },
              },
            ]);
          },
        });
      }
      Alert.alert("Message", undefined, [...actions, { text: "Cancel", style: "cancel" }]);
    },
    [meId, retryMessage]
  );

  const referenceFor = useCallback(
    (message: ChatMessage): Message | null => {
      if (!message.reply_to) {
        return null;
      }
      return messages.find((m) => m.id === message.reply_to) ?? replyCache.get(message.reply_to) ?? null;
    },
    [messages, replyCache]
  );

  const onScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const atBottom = event.nativeEvent.contentOffset.y > -80;
      setNearBottom(atBottom);
      if (atBottom && showNewMessages) {
        markReadNow();
      }
    },
    [showNewMessages, markReadNow]
  );

  const renderBubble = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const mine = item.sender_id === meId;
      const reference = referenceFor(item);
      const failed = item.clientStatus === "failed";
      const sending = item.clientStatus === "sending";
      const read = mine && item.read && item.read_at;

      return (
        <Pressable
          onLongPress={() => openMessageMenu(item)}
          delayLongPress={300}
          accessibilityRole="button"
          accessibilityLabel={`${mine ? "Your message" : "Message from " + (profile?.full_name ?? "user")}${failed ? ", not sent" : ""}. Long press for options`}
          style={({ pressed }) => [
            styles.bubbleRow,
            mine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: mine ? colors.primary : colors.card,
                borderColor: colors.border,
              },
              failed && { opacity: 0.6 },
            ]}
          >
            {reference ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open the message this replies to"
                onPress={() => scrollToMessage(reference.id)}
                style={[styles.quote, { backgroundColor: mine ? "rgba(255,255,255,0.16)" : colors.primarySoft }]}
              >
                <AppText level="small" weight="700" color={mine ? "white" : "primary"} numberOfLines={1}>
                  {reference.sender_id === meId ? "You" : profile?.full_name?.split(" ")[0] ?? "User"}
                </AppText>
                <AppText
                  level="small"
                  color={mine ? "white" : "textSecondary"}
                  numberOfLines={2}
                  style={styles.quoteText}
                >
                  {reference.media_url ? "📷 Photo" : reference.content?.trim() || ""}
                </AppText>
              </Pressable>
            ) : null}

            {item.media_url ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open photo"
                onPress={() => router.push({ pathname: "/viewer", params: { uri: item.media_url!, type: "image" } })}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.mediaImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={item.media_url}
                />
                {(sending || failed) && (
                  <View style={[styles.mediaOverlay, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
                    {sending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <AppText level="body" color="white" weight="700">
                        Not sent
                      </AppText>
                    )}
                  </View>
                )}
              </Pressable>
            ) : null}

            {item.content?.trim() ? (
              <AppText level="body" color={mine ? "white" : "text"} style={styles.bubbleText}>
                {item.content}
              </AppText>
            ) : null}

            <View style={styles.bubbleMeta}>
              {failed ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry message"
                  onPress={() => retryMessage(item)}
                  style={({ pressed }) => [styles.retryChip, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="refresh" size={12} color={colors.error} />
                  <AppText level="small" color="error" weight="700">
                    Not sent · retry
                  </AppText>
                </Pressable>
              ) : null}
              <AppText level="small" color={mine ? "white" : "textMuted"}>
                {chatTime(item.created_at)}
              </AppText>
              {mine && !failed ? (
                <Ionicons
                  name={read ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={read ? "#A5B4FC" : mine ? "rgba(255,255,255,0.75)" : colors.textMuted}
                  accessibilityLabel={read ? "Read" : "Sent"}
                />
              ) : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [meId, profile, referenceFor, openMessageMenu, retryMessage, scrollToMessage, router, colors]
  );

  const renderComposer = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      {offline ? (
        <View style={[styles.offlineBanner, { backgroundColor: colors.errorSoft }]}>
          <Ionicons name="cloud-offline-outline" size={14} color={colors.error} />
          <AppText level="small" color="error" weight="600">
            Offline — messages will not send until you're back online
          </AppText>
        </View>
      ) : null}

      {replyTo ? (
        <View style={[styles.replyBar, { backgroundColor: colors.inputBackground }]}>
          <View style={[styles.replyAccent, { backgroundColor: colors.primary }]} />
          <View style={styles.replyInfo}>
            <AppText level="small" weight="700" color="primary">
              Replying to {replyTo.sender_id === meId ? "yourself" : profile?.full_name?.split(" ")[0] ?? "user"}
            </AppText>
            <AppText level="small" color="textMuted" numberOfLines={1}>
              {replyTo.media_url ? "📷 Photo" : replyTo.content?.trim() || ""}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            onPress={() => setReplyTo(null)}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}

      {showEmoji ? (
        <View style={[styles.emojiPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              accessibilityRole="button"
              accessibilityLabel={`Add ${emoji} to your message`}
              onPress={() => {
                setInput((previous) => previous + emoji);
              }}
              style={({ pressed }) => [styles.emojiButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <AppText level="title">{emoji}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[styles.composer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attach image"
          disabled={sending || uploadingMedia}
          onPress={pickImage}
          style={({ pressed }) => [styles.composerIcon, { opacity: pressed || sending || uploadingMedia ? 0.5 : 1 }]}
          hitSlop={6}
        >
          <Ionicons name="image-outline" size={24} color={colors.primary} />
        </Pressable>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Message…"
          placeholderTextColor={colors.placeholder}
          value={input}
          onChangeText={(value) => {
            setInput(value);
            if (meId && otherId) {
              presenceService.sendTyping(meId, otherId);
            }
          }}
          multiline
          accessibilityLabel="Write a message"
          autoCorrect
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Emoji"
          onPress={() => setShowEmoji((previous) => !previous)}
          style={({ pressed }) => [styles.composerIcon, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={6}
        >
          <Ionicons name="happy-outline" size={24} color={colors.textMuted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={sending || uploadingMedia || (input.trim() === "" && !preview)}
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: colors.primary,
              opacity:
                pressed || sending || uploadingMedia || (input.trim() === "" && !preview) ? 0.5 : 1,
            },
          ]}
        >
          {sending || uploadingMedia ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }

    if (error && messages.length === 0) {
      return <EmptyState icon="cloud-offline-outline" title="Couldn't load this chat" description={error ?? "Check your connection and try again."} />;
    }

    if (messages.length === 0) {
      return (
        <View style={styles.emptyChat}>
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Start the conversation"
            description={`Say hi to ${profile?.full_name?.split(" ")[0] ?? "this user"}.`}
          />
        </View>
      );
    }

    return (
      <FlatList
        ref={listRef}
        data={reversed}
        keyExtractor={(item) => item.id}
        renderItem={renderBubble}
        inverted
        onEndReached={loadOlder}
        onEndReachedThreshold={0.3}
        onScroll={onScroll}
        scrollEventThrottle={120}
        contentContainerStyle={styles.thread}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }}
        ListFooterComponent={
          loadingOlder ? (
            <View style={styles.olderLoader}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
      />
    );
  };

  if (!meId || !otherId) {
    return null;
  }

  return (
    <Screen edges={["top", "left", "right"]} padded={false} style={styles.screen}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to conversations"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${profile?.full_name ?? "user"}'s profile`}
          onPress={() => router.push({ pathname: "/profile/[id]", params: { id: otherId } })}
          style={({ pressed }) => [styles.headerUser, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={styles.headerAvatarWrap}>
            <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={38} />
            {isOnline ? (
              <View style={[styles.headerOnlineDot, { borderColor: colors.card, backgroundColor: colors.success }]} />
            ) : null}
          </View>
          <View style={styles.headerMeta}>
            <AppText level="body" weight="700" numberOfLines={1}>
              {profile?.full_name?.trim() || profile?.username?.trim() || "User"}
            </AppText>
            <AppText level="small" color={typing ? "primary" : isOnline ? "success" : "textMuted"} numberOfLines={1}>
              {statusSubtitle()}
            </AppText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More chat options"
          onPress={() => {
            Alert.alert(profile?.full_name?.trim() ?? "User", undefined, [
              {
                text: "View profile",
                onPress: () => router.push({ pathname: "/profile/[id]", params: { id: otherId } }),
              },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {renderBody()}
        {showNewMessages ? (
          <View style={styles.newMessagesWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to newest messages"
              onPress={markReadNow}
              style={({ pressed }) => [
                styles.newMessagesButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <AppText level="body" color="white" weight="700">
                New messages
              </AppText>
              <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ paddingBottom: insets.bottom + spacing.xs }}>{renderComposer()}</View>

      {/* Attachment preview - confirm before sending */}
      {preview ? (
        <View style={[styles.previewOverlay, { backgroundColor: "rgba(0,0,0,0.82)" }]}>
          <View style={styles.previewCard}>
            <Image source={{ uri: preview.uri }} style={styles.previewImage} contentFit="contain" cachePolicy="memory-disk" />
            <View style={styles.previewActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel photo"
                onPress={() => setPreview(null)}
                style={({ pressed }) => [
                  styles.previewButton,
                  { backgroundColor: "rgba(255,255,255,0.16)", opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <AppText level="body" color="white" weight="700">
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send photo"
                disabled={uploadingMedia}
                onPress={handleSend}
                style={({ pressed }) => [
                  styles.previewButton,
                  { backgroundColor: colors.primary, opacity: pressed || uploadingMedia ? 0.6 : 1 },
                ]}
              >
                {uploadingMedia ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <AppText level="body" color="white" weight="700">
                    Send
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerAvatarWrap: {
    position: "relative",
  },
  headerOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  headerMeta: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  thread: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  bubbleRow: {
    paddingVertical: 3,
    alignItems: "flex-end",
  },
  bubbleRowMine: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  bubbleRowTheirs: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleText: {
    lineHeight: 20,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  quote: {
    borderRadius: radius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: 6,
  },
  quoteText: {
    marginTop: 1,
  },
  mediaImage: {
    width: 220,
    maxWidth: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.small,
    marginBottom: 4,
    backgroundColor: "#111827",
  },
  mediaOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 4,
    borderRadius: radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  retryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
  },
  olderLoader: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  replyAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
  },
  replyInfo: {
    flex: 1,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginHorizontal: spacing.sm,
    paddingLeft: spacing.xs,
    paddingRight: 6,
    paddingVertical: 5,
  },
  composerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    padding: spacing.sm,
    marginHorizontal: spacing.sm,
    marginBottom: 4,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emojiButton: {
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  newMessagesWrap: {
    position: "absolute",
    bottom: spacing.md,
    alignSelf: "center",
  },
  newMessagesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  previewCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radius.large,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 380,
    backgroundColor: "#000000",
  },
  previewActions: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  previewButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});