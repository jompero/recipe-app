import { useOutletContext } from "react-router";
import type { SessionUser } from "../data/auth.ts";

/** What App hands every member page through the router outlet. */
export interface MemberContext {
  user: SessionUser;
}

/** The signed-in member, for pages under the member shell. */
export function useMember(): SessionUser {
  return useOutletContext<MemberContext>().user;
}
