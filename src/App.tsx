import { Outlet, ScrollRestoration } from "react-router";
import { LiveRecipesProvider } from "./components/LiveRecipesProvider.tsx";
import type { MemberContext } from "./components/member.ts";
import { MemberShell } from "./components/MemberShell.tsx";
import {
  AccessErrorScreen,
  LoadingScreen,
  NotOnListScreen,
  SignInScreen,
} from "./components/SessionScreens.tsx";
import { useSession } from "./components/useSession.ts";

/** Picks the screen for the current session; members get the routed pages (see routes.tsx). */
export function App() {
  const session = useSession();

  switch (session.status) {
    case "loading":
      return <LoadingScreen />;
    case "signed-out":
      return <SignInScreen />;
    case "non-member":
      return <NotOnListScreen user={session.user} />;
    case "error":
      return <AccessErrorScreen user={session.user} />;
    case "member":
      return (
        <LiveRecipesProvider>
          {/* Back returns to the same scroll position (needs the data router, see main.tsx). */}
          <ScrollRestoration />
          <MemberShell>
            <Outlet context={{ user: session.user } satisfies MemberContext} />
          </MemberShell>
        </LiveRecipesProvider>
      );
  }
}
