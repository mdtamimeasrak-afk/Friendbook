import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

interface NetworkContextValue {
  isOnline: boolean;
  /** True for a few seconds right after connectivity returns. */
  backOnline: boolean;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

const BACK_ONLINE_VISIBLE_MS = 2500;

/**
 * Lightweight network-state provider (Step 7): listens to native
 * connectivity events only - it never polls. Exposes isOnline for
 * banners/retries and a short-lived backOnline flag.
 */
export function NetworkProvider({ children }: PropsWithChildren) {
  const [isOnline, setIsOnline] = useState(true);
  const [backOnline, setBackOnline] = useState(false);
  const wasOffline = useRef(false);
  const backOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (online) {
        if (wasOffline.current) {
          wasOffline.current = false;
          setBackOnline(true);
          if (backOnlineTimer.current) {
            clearTimeout(backOnlineTimer.current);
          }
          backOnlineTimer.current = setTimeout(() => {
            setBackOnline(false);
          }, BACK_ONLINE_VISIBLE_MS);
        }
      } else {
        wasOffline.current = true;
        setBackOnline(false);
      }
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
      if (backOnlineTimer.current) {
        clearTimeout(backOnlineTimer.current);
      }
    };
  }, []);

  const value = useMemo<NetworkContextValue>(() => ({ isOnline, backOnline }), [isOnline, backOnline]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const value = useContext(NetworkContext);
  if (!value) {
    throw new Error("useNetwork must be used within a <NetworkProvider />");
  }
  return value;
}