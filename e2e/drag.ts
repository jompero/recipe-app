// Dragging with the mouse (US-10.10): press, move in small steps so dnd-kit sees the drag start
// (5px) and then the day under the pointer, and let go over the target.
import type { Locator, Page } from "@playwright/test";

export async function dragTo(page: Page, from: Locator, to: Locator): Promise<void> {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error("Can't drag something that isn't on screen");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 10, start.y + start.height / 2, { steps: 4 });
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 12 });
  await page.mouse.up();
}
