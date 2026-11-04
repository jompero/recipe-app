import { Stack, Text, Title } from "@mantine/core";
import { usePageActions } from "./pageActions.ts";

/** Placeholder cookbook page. US-3.3 puts the grid here. */
export function HomePage() {
  usePageActions([
    { label: "New recipe", to: "/recipe/new" },
    { label: "Show archived", to: "/?archived=1" },
  ]);
  return (
    <Stack gap="xs">
      <Title order={2}>Cookbook</Title>
      <Text c="dimmed">Your recipes will appear here.</Text>
    </Stack>
  );
}
