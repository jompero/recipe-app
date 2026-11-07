// jsdom lacks some browser APIs that Mantine components use.
// Based on the Mantine Vitest guide (https://mantine.dev/guides/vitest/).
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const getComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (elt) => getComputedStyle(elt);
window.HTMLElement.prototype.scrollIntoView = () => {};
// React Router's ScrollRestoration scrolls the window on every navigation; jsdom has no layout.
window.scrollTo = () => {};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

if (!("fonts" in document)) {
  Object.defineProperty(document, "fonts", {
    writable: true,
    value: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
  });
}

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// The member shell's offline strip listens to Firestore on every page; tests get a fake they can
// drive (src/test-utils/fakeConnection.ts) instead of loading Firebase.
vi.mock("./src/data/connection.ts", () => import("./src/test-utils/fakeConnection.ts"));
beforeEach(async () => {
  const { resetConnection } = await import("./src/test-utils/fakeConnection.ts");
  resetConnection();
});
