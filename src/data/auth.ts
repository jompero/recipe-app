// Sign-in and membership (US-1.6). Components use this module; they never touch Firebase.
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase.ts";

export interface SessionUser {
  name: string;
  email: string;
  photoUrl: string | null;
}

/** Everything the UI needs to know about who is using the app. */
export type Session =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "member"; user: SessionUser }
  | { status: "non-member"; user: SessionUser }
  | { status: "error"; user: SessionUser };

/**
 * Calls `onChange` with the current session now and whenever it changes (sign-in, sign-out,
 * membership checked). Returns a function that stops watching.
 */
export function watchSession(onChange: (session: Session) => void): () => void {
  let latestCheck = 0;
  onChange({ status: "loading" });

  return onAuthStateChanged(auth, (firebaseUser) => {
    const check = ++latestCheck;
    if (!firebaseUser) {
      onChange({ status: "signed-out" });
      return;
    }
    const user = toSessionUser(firebaseUser);
    onChange({ status: "loading" });
    isMember(user.email).then(
      (member) => {
        // Ignore a slow answer for a user who has since signed out or switched account.
        if (check === latestCheck) onChange({ status: member ? "member" : "non-member", user });
      },
      () => {
        if (check === latestCheck) onChange({ status: "error", user });
      },
    );
  });
}

/**
 * Opens the Google sign-in popup (ADR-0003). Resolves quietly if the user closes the popup;
 * throws an Error with a message fit to show the user for anything else.
 */
export async function signIn(): Promise<void> {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (error) {
    const code = error instanceof FirebaseError ? error.code : "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
    if (code === "auth/popup-blocked") {
      throw new Error(
        "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.",
        { cause: error },
      );
    }
    throw new Error("Sign-in didn't work. Please try again.", { cause: error });
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Reads the user's own allowlist entry: the rules allow that even for non-members. */
async function isMember(email: string): Promise<boolean> {
  if (!email) return false;
  const entry = await getDoc(doc(db, "allowed_users", email));
  return entry.exists();
}

function toSessionUser(user: User): SessionUser {
  const email = user.email ?? "";
  return { name: user.displayName ?? email, email, photoUrl: user.photoURL };
}
