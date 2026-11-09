import {
  Accessibility,
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
  type DragDropManagerInput,
} from "@dnd-kit/dom";
import { DragDropProvider, useDraggable, type DragDropEventHandlers } from "@dnd-kit/react";
import type { ReactNode } from "react";
import type { MenuEntry } from "../data/menu.ts";
import { dropMove, type DraggedEntry } from "../plan/drop.ts";

/**
 * Plan drag and drop (US-10.10), with `@dnd-kit/react`. A mouse drags once it moves 5px, so a
 * click still opens the recipe. A finger holds still for 300ms first (5px allowance), so a tap
 * still opens it and a swipe still scrolls. The ⋯ button never starts a drag.
 */
const SENSORS = [
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === "touch"
        ? [new PointerActivationConstraints.Delay({ value: 300, tolerance: 5 })]
        : [new PointerActivationConstraints.Distance({ value: 5 })],
    preventActivation: (event) =>
      event.target instanceof Element && event.target.closest("button") !== null,
  }),
];

/**
 * The default plugins (auto-scroll near the screen edges, the lifted entry, no text selection)
 * with two changes. The entry leaves a copy in its place (faded by the CSS), and has no drop
 * animation, as it's already on its new day by then. And no Accessibility plugin, which would
 * make every entry a tab stop with role "button" around its link: Move to… is the keyboard and
 * screen reader way to move an entry, so there's no keyboard dragging.
 */
const PLUGINS: DragDropManagerInput["plugins"] = (defaults) =>
  defaults
    .filter((plugin) => plugin !== Accessibility)
    .map((plugin) =>
      plugin === Feedback ? Feedback.configure({ feedback: "clone", dropAnimation: null }) : plugin,
    );

type DragEnd = NonNullable<DragDropEventHandlers["onDragEnd"]>;

/** Drag and drop around the Plan's days; a drop on another day calls `onMove`. */
export function PlanDragDrop({
  onMove,
  children,
}: {
  onMove: (from: string, to: string, entry: MenuEntry) => void;
  children: ReactNode;
}) {
  const onDragEnd: DragEnd = ({ operation, canceled }) => {
    const move = dropMove(
      operation.source?.data as DraggedEntry | undefined,
      operation.target ? String(operation.target.id) : undefined,
      canceled,
    );
    if (move) onMove(move.from, move.to, move.entry);
  };
  return (
    <DragDropProvider sensors={SENSORS} plugins={PLUGINS} onDragEnd={onDragEnd}>
      {children}
    </DragDropProvider>
  );
}

/** An entry's list item, which drags the entry to another day. */
export function DraggableItem({
  date,
  entry,
  className,
  children,
}: {
  date: string;
  entry: MenuEntry;
  className?: string;
  children: ReactNode;
}) {
  const data: DraggedEntry = { date, entry };
  const { ref } = useDraggable({ id: entry.id, data });
  return (
    <li ref={ref} className={className}>
      {children}
    </li>
  );
}
