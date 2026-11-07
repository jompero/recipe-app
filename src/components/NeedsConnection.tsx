import { Text } from "@mantine/core";

/** The note beside a feature that's disabled while the phone says it's offline (US-9.5). */
export function NeedsConnection() {
  return (
    <Text size="xs" fs="italic" c="dimmed">
      Needs a connection
    </Text>
  );
}
