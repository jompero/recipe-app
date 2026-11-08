// The media queries jsdom answers (it has no layout). vitest.setup.ts's matchMedia asks here, and
// resets it before each test: every query is false (a phone, a mouse) unless a test says otherwise.
import { WIDE_QUERY } from "../components/useWide.ts";

let matching = new Set<string>();

/** Whether matchMedia(query) matches in this test. */
export function mediaMatches(query: string): boolean {
  return matching.has(query);
}

/** Makes the app see a wide screen (iPad landscape, desktop) for the rest of this test. */
export function setWideScreen(): void {
  matching = new Set([...matching, WIDE_QUERY]);
}

export function resetMedia(): void {
  matching = new Set();
}
