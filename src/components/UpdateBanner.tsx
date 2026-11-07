import { Button, Group, Text } from "@mantine/core";
import { useRegisterSW } from "virtual:pwa-register/react";
import { LABEL_STYLE } from "../theme.ts";

/** Asks the service worker to look for a new version whenever the app comes back into view. */
function checkWhenVisible(registration: ServiceWorkerRegistration) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    // Fails offline; the next visit tries again.
    registration.update().catch(() => {});
  });
}

/**
 * The update banner (US-9.4, ADR-0009): a new version waits until the member taps Reload, so an
 * update never reloads a half-finished edit or a grocery list being ticked. Ignored, it takes over
 * on the next fresh launch. Home-screen apps stay suspended for days on iOS, so besides the
 * check at launch, it also checks each time the app comes back into view.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_url, registration) => {
      if (registration) checkWhenVisible(registration);
    },
    onRegisterError: (error: unknown) =>
      console.error("Couldn't register the service worker", error),
  });

  if (!needRefresh) return null;
  return (
    <Group
      role="status"
      aria-label="Update ready"
      justify="center"
      gap="sm"
      py={6}
      px="md"
      bg="linen.0"
      pos="fixed"
      top={0}
      left={0}
      right={0}
      style={{ zIndex: 300, borderBottom: "1px solid var(--mantine-color-linen-2)" }}
    >
      <Text component="span" style={LABEL_STYLE}>
        Update ready
      </Text>
      <Button size="compact-xs" variant="outline" onClick={() => void updateServiceWorker()}>
        Reload
      </Button>
    </Group>
  );
}
