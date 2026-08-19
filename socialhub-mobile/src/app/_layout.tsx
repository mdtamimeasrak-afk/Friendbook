import { DarkTheme, DefaultTheme, Stack, ThemeProvider, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";

import { SessionProvider, useSession } from "@/context/session";
import { ThemeProvider as AppThemeProvider, useTheme } from "@/context/theme";
import { NetworkProvider } from "@/context/network";
import { AppErrorBoundary } from "@/components/ui/app-error-boundary";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { pushService } from "@/services/pushService";
import { consumePendingLink, navigateToTarget, savePendingLink } from "@/lib/deep-link";

SplashScreen.preventAutoHideAsync();

// Foreground notification handler must exist before any notification
// can arrive (module scope, not inside a component).
pushService.installHandler();

/**
 * Root layout:
 * 1. Restores the Supabase session (splash stays visible).
 * 2. Protects routes: (tabs) + stacks only for signed-in users,
 *    (auth) only for signed-out users.
 * 3. Step 7: error boundary, offline banner, push registration and
 *    cold-start deep-link routing.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <NetworkProvider>
          <SessionProvider>
            <AppErrorBoundary>
              <RootNavigator />
            </AppErrorBoundary>
          </SessionProvider>
        </NetworkProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();
  const { colors, isDark } = useTheme();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide();
    }
  }, [isLoading]);

  // Push: register the device token on sign-in, remove it on sign-out,
  // and keep notification-tap routing active for the whole app life.
  useEffect(() => {
    if (isLoading) {
      return;
    }
    const userId = session?.user?.id ?? null;
    if (userId === previousUserId.current) {
      return;
    }
    const wasUserId = previousUserId.current;
    previousUserId.current = userId;

    if (userId) {
      pushService.setupChannels();
      pushService.registerToken(userId).catch(() => {
        // Token registration is best-effort (permission may be denied).
      });
    } else if (wasUserId) {
      pushService.unregisterToken(wasUserId).catch(() => {
        // Best-effort cleanup.
      });
    }
  }, [isLoading, session?.user?.id]);

  // Keep the registered token in sync if the push service rolls it over.
  useEffect(() => {
    const unsubscribe = pushService.watchTokenChanges();
    return unsubscribe;
  }, []);

  // Notification taps -> central deep-link routing.
  useEffect(() => {
    const unsubscribe = pushService.handleNotificationResponses(() => Boolean(session));
    return unsubscribe;
  }, [session]);

  // Deep links: when signed in expo-router handles them natively.
  // When signed out we remember the destination and restore it after
  // the next successful sign-in (cold-start flow).
  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => {
        if (url && !session) {
          savePendingLink(url);
        }
      })
      .catch(() => {
        // Best-effort.
      });
    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url && !session) {
        savePendingLink(event.url);
      }
    });
    return () => subscription.remove();
  }, [session]);

  // After a successful sign-in, land where the user originally tapped.
  useEffect(() => {
    if (!session) {
      return;
    }
    consumePendingLink().then((target) => {
      if (target) {
        navigateToTarget(target);
      }
    });
  }, [session]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="messages" />
          <Stack.Screen name="story" />
          <Stack.Screen name="post" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="search" />
          <Stack.Screen name="viewer" options={{ presentation: "fullScreenModal", animation: "fade" }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}