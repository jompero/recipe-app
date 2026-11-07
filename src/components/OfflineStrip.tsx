import { Text } from "@mantine/core";

/** The strip's height, which the menu button and the edit form's bar move up by while it shows. */
export const OFFLINE_STRIP_HEIGHT = 26;

/**
 * The offline strip (US-9.5): a slim line along the bottom edge, under the menu button, while the
 * app works from its offline copy. It goes away by itself.
 */
export function OfflineStrip() {
  return (
    <Text
      role="status"
      aria-label="Offline"
      size="xs"
      fs="italic"
      c="dimmed"
      ta="center"
      bg="linen.0"
      pos="fixed"
      bottom={0}
      left={0}
      right={0}
      h={OFFLINE_STRIP_HEIGHT}
      lh={`${String(OFFLINE_STRIP_HEIGHT)}px`}
      px="md"
      style={{ zIndex: 150, borderTop: "1px solid var(--mantine-color-linen-2)" }}
    >
      Offline: changes will sync when you&apos;re back online
    </Text>
  );
}
