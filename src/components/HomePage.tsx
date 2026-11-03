import { Stack, Text, Title } from "@mantine/core";

/** Placeholder member home. Epic 3 puts the cookbook here. */
export function HomePage() {
  return (
    <Stack gap="xs">
      <Title order={2}>Cookbook</Title>
      <Text c="dimmed">Your recipes will appear here.</Text>
    </Stack>
  );
}
