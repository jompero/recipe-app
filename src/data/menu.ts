// The Plan in Firestore: one menu_days/{YYYY-MM-DD} document per Plan day (ADR-0006, amended in
// Epic 5). Every write is an arrayUnion / arrayRemove or a batch of them, never a transaction, so
// they all work offline and two members adding to the same day never overwrite each other.
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION = "menu_days";

/** The longest note, in characters (after trimming). */
export const NOTE_MAX = 80;

/** One item on a Plan day: a recipe or a short note. The ID keeps entries distinct. */
export type MenuEntry = { id: string; recipeId: string } | { id: string; note: string };

/** An entry before it's added: the ID is made when it's saved. */
export type NewMenuEntry = { recipeId: string } | { note: string };

/** Plan days by date key ("2026-11-05"). Days with no document are missing, not empty. */
export type PlanDays = Record<string, MenuEntry[]>;

function isEntry(value: unknown): value is MenuEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry["id"] === "string" &&
    (typeof entry["recipeId"] === "string" || typeof entry["note"] === "string")
  );
}

/** The rules check the list, not each item in it, so anything malformed is skipped here. */
function entriesOf(data: Record<string, unknown>): MenuEntry[] {
  const entries = data["entries"];
  return Array.isArray(entries) ? entries.filter(isEntry) : [];
}

/** A short random ID, unique enough within one day. */
function newEntryId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

/** The new entry with its ID, or an error for an empty or too-long note. */
function withId(entry: NewMenuEntry): MenuEntry {
  if ("recipeId" in entry) return { id: newEntryId(), recipeId: entry.recipeId };
  const note = entry.note.trim();
  if (note.length === 0) throw new Error("A note can't be empty.");
  if (note.length > NOTE_MAX)
    throw new Error(`A note can be at most ${String(NOTE_MAX)} characters.`);
  return { id: newEntryId(), note };
}

const dayRef = (date: string) => doc(db, COLLECTION, date);

/**
 * Calls onChange with the Plan days from `first` to `last` (date keys, both included) now and
 * after every change, from any device. Returns a function that stops listening.
 */
export function watchDays(
  first: string,
  last: string,
  onChange: (days: PlanDays) => void,
  onError?: (error: Error) => void,
): () => void {
  // Document IDs compare as strings, and "YYYY-MM-DD" sorts by date.
  const range = query(
    collection(db, COLLECTION),
    where(documentId(), ">=", first),
    where(documentId(), "<=", last),
  );
  return onSnapshot(
    range,
    (snapshot) => {
      const days: PlanDays = {};
      for (const day of snapshot.docs) days[day.id] = entriesOf(day.data());
      onChange(days);
    },
    onError,
  );
}

/** Adds an entry to the end of a Plan day, creating the day if needed. Returns the saved entry. */
export async function addEntry(date: string, entry: NewMenuEntry): Promise<MenuEntry> {
  const saved = withId(entry);
  await setDoc(
    dayRef(date),
    { entries: arrayUnion(saved), updatedAt: serverTimestamp() },
    { merge: true },
  );
  return saved;
}

/**
 * Removes an entry (as read from watchDays) from a Plan day. The last one leaves an empty day:
 * deleting the document safely would need a transaction, and those fail offline.
 */
export async function removeEntry(date: string, entry: MenuEntry): Promise<void> {
  await updateDoc(dayRef(date), { entries: arrayRemove(entry), updatedAt: serverTimestamp() });
}

/** Moves an entry to another Plan day, keeping its ID, in one write. */
export async function moveEntry(from: string, to: string, entry: MenuEntry): Promise<void> {
  if (from === to) return;
  const batch = writeBatch(db);
  batch.update(dayRef(from), { entries: arrayRemove(entry), updatedAt: serverTimestamp() });
  batch.set(
    dayRef(to),
    { entries: arrayUnion(entry), updatedAt: serverTimestamp() },
    { merge: true },
  );
  await batch.commit();
}
