import { AppShell, Avatar, Button, Group, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { signOut, type SessionUser } from "../data/auth.ts";

/** Phone-first frame for signed-in members: header with who you are and sign-out. */
export function MemberShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Title order={3}>Recipes</Title>
          <Group gap="xs" wrap="nowrap" miw={0}>
            <Avatar src={user.photoUrl} alt="" size="sm" radius="xl" name={user.name} />
            <Text size="sm" truncate visibleFrom="xs" maw={160}>
              {user.name}
            </Text>
            <Button variant="subtle" size="compact-sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
