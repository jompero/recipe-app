// Dragging with the mouse (US-10.10): press, move in small steps so dnd-kit sees the drag start
// (5px) and then the day under the pointer, and let go over the target.
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Drags `from` onto `to`. With `highlighted`, waits until that day shows it's the drop target
 * before letting go, as dnd-kit finds the day under the pointer a frame after the move. Then
 * waits for the drag to finish: dnd-kit ignores a new press while it's still ending the last one.
 */
export async function dragTo(
  page: Page,
  from: Locator,
  to: Locator,
  highlighted?: Locator,
): Promise<void> {
  const dragging = page.locator("[data-dnd-dragging], [data-dnd-placeholder]");
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error("Can't drag something that isn't on screen");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 10, start.y + start.height / 2, { steps: 4 });
  await expect(dragging).not.toHaveCount(0);
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 12 });
  if (highlighted) await expect(highlighted).toHaveAttribute("data-drop-target");
  await page.mouse.up();
  await expect(dragging).toHaveCount(0);
  // The manager goes back to idle just after the attributes go.
  await page.waitForTimeout(100);
}
