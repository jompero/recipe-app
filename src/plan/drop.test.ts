import { dropMove } from "./drop.ts";

const entry = { id: "e1", recipeId: "pie" };
const dragged = { date: "2026-11-09", entry };

test("a drop on another day moves the entry there", () => {
  expect(dropMove(dragged, "2026-11-12")).toEqual({ from: "2026-11-09", to: "2026-11-12", entry });
});

test("a drop on the same day does nothing", () => {
  expect(dropMove(dragged, "2026-11-09")).toBeNull();
});

test("a drop over no day, or a cancelled drag, does nothing", () => {
  expect(dropMove(dragged, undefined)).toBeNull();
  expect(dropMove(dragged, "2026-11-12", true)).toBeNull();
  expect(dropMove(undefined, "2026-11-12")).toBeNull();
});
