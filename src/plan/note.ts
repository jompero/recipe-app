// Notes on the Plan ("Leftovers", "Eating out"): the rules shared by the form and the data module.

/** The longest note, in characters (after trimming). */
export const NOTE_MAX = 80;

/** Why a note can't be saved, or null if it can. The note is checked after trimming. */
export function noteProblem(note: string): string | null {
  const trimmed = note.trim();
  if (trimmed.length === 0) return "A note can't be empty.";
  if (trimmed.length > NOTE_MAX) return `A note can be at most ${String(NOTE_MAX)} characters.`;
  return null;
}
