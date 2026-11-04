import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router";
import { DataPage } from "./components/DataPage.tsx";
import { HomePage } from "./components/HomePage.tsx";
import { MemberShell } from "./components/MemberShell.tsx";
import {
  AccessErrorScreen,
  LoadingScreen,
  NotOnListScreen,
  SignInScreen,
} from "./components/SessionScreens.tsx";
import { useSession } from "./components/useSession.ts";

// PROTOTYPE (US-3.1): dev-only design prototype at #/prototype, dropped from production builds.
const CookbookPrototype = import.meta.env.DEV
  ? lazy(() => import("./components/prototype/CookbookPrototype.tsx"))
  : null;

/** Picks the screen for the current session; members get the routed app. */
export function App() {
  const session = useSession();
  const location = useLocation();

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
      if (CookbookPrototype && location.pathname.startsWith("/prototype")) {
        return (
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/prototype" element={<CookbookPrototype />} />
              <Route path="/prototype/:id" element={<CookbookPrototype />} />
            </Routes>
          </Suspense>
        );
      }
      return (
        <MemberShell user={session.user}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/data" element={<DataPage />} />
          </Routes>
        </MemberShell>
      );
  }
}
