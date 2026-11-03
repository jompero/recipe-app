import { Anchor, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

/** Placeholder member home. Epic 3 puts the cookbook here, and the Data link moves to its menu. */
export function HomePage() {
  return (
    <Stack gap="xs">
      <Title order={2}>Cookbook</Title>
      <Text c="dimmed">Your recipes will appear here.</Text>
      <Anchor component={Link} to="/data">
        Data
      </Anchor>
    </Stack>
  );
}
