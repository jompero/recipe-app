import { Avatar, Button, Stack, Text, Title } from "@mantine/core";
import { signOut } from "../data/auth.ts";
import { useMember } from "./member.ts";
import { usePageMenu } from "./pageMenu.ts";

/** Who you're signed in as, and Sign out. */
export function AccountPage() {
  const user = useMember();
  usePageMenu("Account");
  return (
    <Stack align="center" gap="sm" pt="xl">
      <Title order={1}>Account</Title>
      <Avatar src={user.photoUrl} alt="" size="lg" radius="xl" name={user.name} mt="md" />
      <Text>{user.name}</Text>
      <Text c="dimmed" size="sm">
        {user.email}
      </Text>
      <Button variant="outline" mt="md" onClick={() => void signOut()}>
        Sign out
      </Button>
    </Stack>
  );
}
