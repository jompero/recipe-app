import { useMediaQuery } from "@mantine/hooks";

/** The wide layout (Epic 10): Mantine's md breakpoint, 62em (about 992px), and up. */
export const WIDE_QUERY = "(min-width: 62em)";

/**
 * Whether the screen gets the wide layout: iPad landscape and desktop. Read at once on the first
 * render (there's no server rendering to match), so a wide screen never starts with a flash of the
 * phone layout, or the Plan with a week it then swaps for a month.
 */
export function useWide(): boolean {
  return useMediaQuery(WIDE_QUERY, undefined, { getInitialValueInEffect: false }) ?? false;
}
