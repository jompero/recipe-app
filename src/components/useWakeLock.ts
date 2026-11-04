import { useEffect } from "react";

/**
 * Keeps the screen awake while the calling component is mounted (Screen Wake Lock API). The
 * browser drops the lock whenever the page is hidden, so it's requested again when the page
 * becomes visible. Does nothing where the API is missing or the request is refused (e.g. battery
 * saver).
 */
export function useWakeLock(): void {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let active = true;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (active) sentinel = lock;
        else await lock.release();
      } catch {
        // Refused or unavailable right now: the screen just sleeps as usual.
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release().catch(() => {});
    };
  }, []);
}
