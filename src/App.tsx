import { Route, Routes } from "react-router";
import { HomePage } from "./components/HomePage.tsx";
import { MemberShell } from "./components/MemberShell.tsx";
import {
  AccessErrorScreen,
  LoadingScreen,
  NotOnListScreen,
  SignInScreen,
} from "./components/SessionScreens.tsx";
import { useSession } from "./components/useSession.ts";

/** Picks the screen for the current session; members get the routed app. */
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
        <MemberShell user={session.user}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemberShell>
      );
  }
}
