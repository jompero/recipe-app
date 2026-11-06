// The grocery list in Firestore: one shared document, grocery_lists/current (ADR-0008). It holds
// the source lines and the IDs of the ticked ones; merging happens in the browser
// (src/groceries/). Every write is a set, an arrayUnion or an arrayRemove, never a transaction, so
// all of them work offline and two members ticking at once never overwrite each other.
import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { SourceLine } from "../groceries/types.ts";

const listRef = () => doc(db, "grocery_lists", "current");

/** The list as members see it. A list that was never saved is empty. */
export interface GroceryList {
  lines: SourceLine[];
  ticked: string[];
  /** When the list last changed, or null if it was never saved. */
  updatedAt: Date | null;
}

/** A source line before it's saved: the ID is made when it's written. */
export type NewSourceLine = Omit<SourceLine, "id">;

/** The longest line a member may add by hand, as for Plan notes. */
export const HAND_LINE_MAX = 80;

const OPTIONAL_TEXT = ["recipeId", "title", "entryId"] as const;

function isSourceLine(value: unknown): value is SourceLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line["id"] === "string" &&
    typeof line["raw"] === "string" &&
    typeof line["scale"] === "number" &&
    OPTIONAL_TEXT.every((key) => line[key] === undefined || typeof line[key] === "string")
  );
}

/** A short random ID, unique enough within one list. */
function newLineId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

const withIds = (lines: NewSourceLine[]): SourceLine[] =>
  lines.map((line) => ({ id: newLineId(), ...line }));

/**
 * Calls onChange with the grocery list now and after every change, from any device. The rules
 * check the lists, not each line, so anything malformed is skipped here. Returns a function that
 * stops listening.
 */
export function watchGroceryList(
  onChange: (list: GroceryList) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    listRef(),
    (snapshot) => {
      // A write still on its way to the server shows its own time, not null.
      const data: Record<string, unknown> = snapshot.data({ serverTimestamps: "estimate" }) ?? {};
      const lines = data["lines"];
      const ticked = data["ticked"];
      const updatedAt = data["updatedAt"];
      onChange({
        lines: Array.isArray(lines) ? lines.filter(isSourceLine) : [],
        ticked: Array.isArray(ticked)
          ? ticked.filter((id): id is string => typeof id === "string")
          : [],
        updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : null,
      });
    },
    onError,
  );
}

/** Starts a new list with these lines, and no ticks. Returns the saved lines. */
export async function replaceList(lines: NewSourceLine[]): Promise<SourceLine[]> {
  const saved = withIds(lines);
  await setDoc(listRef(), { lines: saved, ticked: [], updatedAt: serverTimestamp() });
  return saved;
}

/** Adds lines after the ones already on the list, creating it if needed. Returns them. */
export async function addLines(lines: NewSourceLine[]): Promise<SourceLine[]> {
  const saved = withIds(lines);
  await setDoc(
    listRef(),
    { lines: arrayUnion(...saved), updatedAt: serverTimestamp() },
    { merge: true },
  );
  return saved;
}

/** Adds one line typed by a member: trimmed, 1–80 characters, at 1×, with no recipe. */
export async function addHandLine(raw: string): Promise<SourceLine> {
  const text = raw.trim();
  if (text === "") throw new Error("Type something to add.");
  if (text.length > HAND_LINE_MAX) {
    throw new Error(`A line can be at most ${HAND_LINE_MAX} characters.`);
  }
  const [line] = await addLines([{ raw: text, scale: 1 }]);
  return line!;
}

/** Ticks lines (all of a merged line's source lines at once). */
export async function tick(ids: string[]): Promise<void> {
  await updateDoc(listRef(), { ticked: arrayUnion(...ids), updatedAt: serverTimestamp() });
}

export async function untick(ids: string[]): Promise<void> {
  await updateDoc(listRef(), { ticked: arrayRemove(...ids), updatedAt: serverTimestamp() });
}

/** Removes lines (exactly as read from watchGroceryList) and their ticks, in one write. */
export async function removeLines(lines: SourceLine[]): Promise<void> {
  await updateDoc(listRef(), {
    lines: arrayRemove(...lines),
    ticked: arrayRemove(...lines.map((line) => line.id)),
    updatedAt: serverTimestamp(),
  });
}

/** Empties the list. The document stays: members can't delete it. */
export async function clearList(): Promise<void> {
  await setDoc(listRef(), { lines: [], ticked: [], updatedAt: serverTimestamp() });
}
