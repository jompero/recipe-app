import { act, renderHook, waitFor } from "@testing-library/react";
import { useWakeLock } from "./useWakeLock.ts";

// A fake Screen Wake Lock API: each request hands out a sentinel the test can inspect.
function fakeWakeLock({ fails = false } = {}) {
  const sentinels: { release: ReturnType<typeof vi.fn> }[] = [];
  const request = vi.fn((type: string) => {
    if (fails) return Promise.reject(new DOMException("Battery saver is on", "NotAllowedError"));
    expect(type).toBe("screen");
    const sentinel = { release: vi.fn(() => Promise.resolve()) };
    sentinels.push(sentinel);
    return Promise.resolve(sentinel);
  });
  Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
  return { request, sentinels };
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "wakeLock");
  setVisibility("visible");
});

test("keeps the screen awake while mounted, and lets go on unmount", async () => {
  const { request, sentinels } = fakeWakeLock();
  const { unmount } = renderHook(() => useWakeLock());
  await waitFor(() => expect(request).toHaveBeenCalledOnce());

  unmount();
  await waitFor(() => expect(sentinels[0]?.release).toHaveBeenCalledOnce());
});

test("asks again when the page becomes visible (the browser drops the lock when hidden)", async () => {
  const { request } = fakeWakeLock();
  renderHook(() => useWakeLock());
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));

  setVisibility("hidden");
  setVisibility("visible");
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
});

test("does nothing where Wake Lock isn't supported", () => {
  expect("wakeLock" in navigator).toBe(false);
  const { unmount } = renderHook(() => useWakeLock());
  unmount();
});

test("a refused request (e.g. battery saver) is ignored", async () => {
  const { request } = fakeWakeLock({ fails: true });
  const { unmount } = renderHook(() => useWakeLock());
  await waitFor(() => expect(request).toHaveBeenCalledOnce());
  unmount();
});
