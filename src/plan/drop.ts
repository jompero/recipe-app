import type { MenuEntry } from "../data/menu.ts";

/** What a dragged Plan entry carries: the entry and the day it's on (US-10.10). */
export interface DraggedEntry {
  date: string;
  entry: MenuEntry;
}

/** A move a drop asks for: the same arguments Move to… gives `moveEntry`. */
export interface DropMove {
  from: string;
  to: string;
  entry: MenuEntry;
}

/**
 * The move a finished drag asks for, or null when it asks for none: the drag was cancelled, it
 * ended over no day, or over the day the entry is already on. Drops only move between days; the
 * entry goes to the end of the target day, as with Move to….
 */
export function dropMove(
  dragged: DraggedEntry | undefined,
  target: string | undefined,
  canceled = false,
): DropMove | null {
  if (canceled || !dragged || !target || target === dragged.date) return null;
  return { from: dragged.date, to: target, entry: dragged.entry };
}
