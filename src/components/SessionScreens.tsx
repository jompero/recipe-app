// Full-page screens shown before the member app: loading, signed out, not on the list, error.
import { Alert, Button, Center, Container, Loader, Stack, Text, Title } from "@mantine/core";
import { useState, type ReactNode } from "react";
import { signIn, signOut, type SessionUser } from "../data/auth.ts";
import { NeedsConnection } from "./NeedsConnection.tsx";
import { usePhoneOffline } from "./useOffline.ts";

function Page({ children }: { children: ReactNode }) {
  return (
    <Container size="xs" py="xl">
      <Stack gap="md">{children}</Stack>
    </Container>
  );
}

export function LoadingScreen() {
  return (
    <Center h="100dvh">
      <Loader aria-label="Loading" />
    </Center>
  );
}

export function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const offline = usePhoneOffline();

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <Title order={1}>Recipes</Title>
      <Text c="dimmed">Our shared cookbook and meal planner.</Text>
      {error && (
        <Alert color="red" title="Couldn't sign in">
          {error}
        </Alert>
      )}
      <Button size="md" loading={busy} disabled={offline} onClick={() => void handleSignIn()}>
        Sign in with Google
      </Button>
      {offline && <NeedsConnection />}
    </Page>
  );
}

function SignOutButton() {
  return (
    <Button variant="default" onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}

export function NotOnListScreen({ user }: { user: SessionUser }) {
  return (
    <Page>
      <Title order={1}>You're not on the list</Title>
      <Text>
        You're signed in as <strong>{user.email}</strong>, but this account hasn't been added to the
        cookbook. Ask the owner to add it, or sign out and use a different Google account.
      </Text>
      <SignOutButton />
    </Page>
  );
}

export function AccessErrorScreen({ user }: { user: SessionUser }) {
  return (
    <Page>
      <Title order={1}>Couldn't check your access</Title>
      <Text>
        You're signed in as <strong>{user.email}</strong>, but we couldn't reach the cookbook to
        check your access. Check your connection and reload the page.
      </Text>
      <SignOutButton />
    </Page>
  );
}
