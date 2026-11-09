// US-10.10: dragging an entry to another day in the week view, with the mouse. The touch
// long-press is checked by hand on a real iPhone.
import { expect, test } from "@playwright/test";
import { dragTo } from "./drag.ts";
import { makeMember, signedInPage } from "./members.ts";
import { putDoc, recipe } from "./seed.ts";

const CAROL = "carol@example.com";

test("an entry dragged to another day moves there, and a click still opens the recipe", async ({
  browser,
}) => {
  await makeMember(CAROL);
  await putDoc("recipes/e2e-drag-stew", recipe("Drag Stew", ["1 onion"]));
  await putDoc("menu_days/2031-03-03", {
    entries: [{ id: "e2e-drag", recipeId: "e2e-drag-stew" }],
    updatedAt: new Date(),
  });
  const page = await signedInPage(browser, CAROL, "#/plan?week=2031-03-03");
  const monday = page.getByRole("region", { name: "Mon 3 Mar" });
  const thursday = page.getByRole("region", { name: "Thu 6 Mar" });
  const stew = monday.getByRole("link", { name: "Drag Stew" });
  await expect(stew).toBeVisible();

  // Letting go on the same day does nothing.
  await dragTo(page, stew, monday.getByText("Mon 3 Mar"));
  await expect(stew).toBeVisible();

  await dragTo(page, stew, thursday);
  await expect(thursday.getByRole("link", { name: "Drag Stew" })).toBeVisible();
  await expect(monday.getByText("Nothing planned")).toBeVisible();

  // It's saved: still on Thursday after a reload.
  await page.reload();
  await expect(thursday.getByRole("link", { name: "Drag Stew" })).toBeVisible();

  // A plain click isn't a drag.
  await thursday.getByRole("link", { name: "Drag Stew" }).click();
  await expect(page.getByRole("heading", { name: "Drag Stew" })).toBeVisible();
});
