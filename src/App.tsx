import { Outlet } from "react-router";
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
        <MemberShell>
          <Outlet context={{ user: session.user } satisfies MemberContext} />
        </MemberShell>
      );
  }
}
