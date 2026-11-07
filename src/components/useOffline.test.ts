import { act, renderHook } from "@testing-library/react";
import { setFromCache } from "../test-utils/fakeConnection.ts";
import { FROM_CACHE_HOLD_MS, useOfflineStrip, usePhoneOffline } from "./useOffline.ts";

/** Makes the phone report offline (or online) and fires the matching event. */
function phone(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
  window.dispatchEvent(new Event(online ? "online" : "offline"));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("usePhoneOffline", () => {
  test("follows the phone's offline and online events", () => {
    const { result } = renderHook(() => usePhoneOffline());
    expect(result.current).toBe(false);
    act(() => phone(false));
    expect(result.current).toBe(true);
    act(() => phone(true));
    expect(result.current).toBe(false);
  });
});

describe("useOfflineStrip", () => {
  test("hidden while online and Firestore reaches the server", () => {
    const { result } = renderHook(() => useOfflineStrip());
    expect(result.current).toBe(false);
  });

  test("the phone saying offline shows it at once, and back online hides it", () => {
    const { result } = renderHook(() => useOfflineStrip());
    act(() => phone(false));
    expect(result.current).toBe(true);
    act(() => phone(true));
    expect(result.current).toBe(false);
  });

  test("Firestore's offline copy shows it only once it has held for a while", () => {
    const { result } = renderHook(() => useOfflineStrip());
    act(() => setFromCache(true));
    act(() => {
      vi.advanceTimersByTime(FROM_CACHE_HOLD_MS - 1);
    });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);

    act(() => setFromCache(false));
    expect(result.current).toBe(false);
  });

  test("a moment on the offline copy at start-up never shows it", () => {
    const { result } = renderHook(() => useOfflineStrip());
    act(() => setFromCache(true));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    act(() => setFromCache(false));
    act(() => {
      vi.advanceTimersByTime(FROM_CACHE_HOLD_MS * 2);
    });
    expect(result.current).toBe(false);
  });

  test("going back to the offline copy waits the full time again", () => {
    const { result } = renderHook(() => useOfflineStrip());
    act(() => setFromCache(true));
    act(() => {
      vi.advanceTimersByTime(FROM_CACHE_HOLD_MS);
    });
    act(() => setFromCache(false));
    act(() => setFromCache(true));
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(FROM_CACHE_HOLD_MS);
    });
    expect(result.current).toBe(true);
  });
});
