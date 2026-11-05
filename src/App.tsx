import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { IMPORT_DATA_KEY } from "./components/ImportPage.tsx";
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
  const location = useLocation();

  // A recipe from the bookmarklet (#/import?d=…) arriving before sign-in: the import page only
  // mounts for members, so keep its data until then (the sign-in popup normally leaves the URL
  // as it is, but this doesn't rely on it).
  const importData =
    location.pathname === "/import" ? new URLSearchParams(location.search).get("d") : null;
  useEffect(() => {
    if (importData && session.status !== "member") {
      sessionStorage.setItem(IMPORT_DATA_KEY, importData);
    }
  }, [importData, session.status]);

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
