import { useEffect, useState } from "react";
import { watchSession, type Session } from "../data/auth.ts";

/** The current session, kept up to date. */
export function useSession(): Session {
  const [session, setSession] = useState<Session>({ status: "loading" });
  useEffect(() => watchSession(setSession), []);
  return session;
}
