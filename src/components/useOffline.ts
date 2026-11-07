import { useEffect, useState, useSyncExternalStore } from "react";
import { watchFromCache } from "../data/connection.ts";

/**
 * How long Firestore must keep working from its offline copy before the strip shows. Every cold
 * start reads from the offline copy for a moment before it reaches the server, and that moment
 * mustn't flash the strip. Long enough for a slow phone connection to catch up, short enough
 * that a real outage shows within a few seconds.
 */
export const FROM_CACHE_HOLD_MS = 5000;

function subscribeToPhone(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Whether the phone itself says it's offline. Only "offline" can be trusted: "online" is also
 * reported on Wi-Fi without internet (MDN). So it's used to disable features that need the
 * network, which otherwise try and show their usual errors.
 */
export function usePhoneOffline(): boolean {
  return useSyncExternalStore(subscribeToPhone, () => !navigator.onLine);
}

/**
 * Whether to show the offline strip (members only, since it listens to Firestore): at once when
 * the phone says it's offline, or once Firestore has worked from its offline copy for
 * FROM_CACHE_HOLD_MS. Hidden again as soon as the phone is back online and Firestore has reached
 * the server.
 */
export function useOfflineStrip(): boolean {
  const phoneOffline = usePhoneOffline();
  const [fromCache, setFromCache] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => watchFromCache(setFromCache), []);

  useEffect(() => {
    if (!fromCache) return;
    const timer = setTimeout(() => setHeld(true), FROM_CACHE_HOLD_MS);
    return () => {
      clearTimeout(timer);
      setHeld(false);
    };
  }, [fromCache]);

  return phoneOffline || (fromCache && held);
}
