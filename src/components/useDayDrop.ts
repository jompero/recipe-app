import { useDragOperation, useDroppable } from "@dnd-kit/react";
import type { DraggedEntry } from "../plan/drop.ts";

/**
 * Makes a Plan day a drop target (US-10.10): `ref` goes on the day, and `isDropTarget` is true
 * while an entry is dragged over it. Not the day the dragged entry is on, as that drop does nothing.
 */
export function useDayDrop(date: string): {
  ref: (element: Element | null) => void;
  isDropTarget: boolean;
} {
  const { source } = useDragOperation();
  const from = (source?.data as DraggedEntry | undefined)?.date;
  const { ref, isDropTarget } = useDroppable({ id: date, disabled: from === date });
  return { ref, isDropTarget };
}
