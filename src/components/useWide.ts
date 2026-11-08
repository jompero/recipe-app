import { useMediaQuery } from "@mantine/hooks";

/** The wide layout (Epic 10): Mantine's md breakpoint, 62em (about 992px), and up. */
export const WIDE_QUERY = "(min-width: 62em)";

/** Whether the screen gets the wide layout: iPad landscape and desktop. */
export function useWide(): boolean {
  return useMediaQuery(WIDE_QUERY) ?? false;
}
