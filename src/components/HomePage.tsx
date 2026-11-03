import { Container, Stack, Text, Title } from "@mantine/core";

/** Placeholder until the sign-in shell (US-1.6) and the cookbook (Epic 3) exist. */
export function HomePage() {
  return (
    <Container size="xs" py="xl">
      <Stack gap="xs">
        <Title order={1}>Recipes</Title>
        <Text c="dimmed">Our shared cookbook and meal planner. Coming soon.</Text>
      </Stack>
    </Container>
  );
}
