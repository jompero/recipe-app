// The wide layout (Epic 10), at iPad landscape size: only the `ipad-landscape` project runs this
// file. Each wide-layout story adds its page's check here.
import { expect, test } from "@playwright/test";
import { dragTo } from "./drag.ts";
import { makeMember, signedInPage } from "./members.ts";
import { putDoc, recipe, todayKey } from "./seed.ts";

const DAVE = "dave@example.com";

test("US-10.2: the top bar replaces the bottom button and goes to every section", async ({
  browser,
}) => {
  await makeMember(DAVE);
  const page = await signedInPage(browser, DAVE, "./");
  const sections = page.getByRole("navigation", { name: "Sections" });

  await expect(page.getByRole("heading", { name: "Cookbook" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);

  for (const [link, heading] of [
    ["Plan", "Plan"],
    ["Grocery list", "Grocery list"],
    ["Data", "Data"],
    ["Account", "Account"],
    ["Cookbook", "Cookbook"],
  ] as const) {
    await sections.getByRole("link", { name: link }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(sections.getByRole("link", { name: link })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }

  // The page's actions are in the bar: the Plan's Roll… opens the roller.
  await sections.getByRole("link", { name: "Plan" }).click();
  await page
    .getByRole("group", { name: "Page actions" })
    .getByRole("button", { name: "Roll…" })
    .click();
  await expect(page.getByRole("heading", { name: "Roll" })).toBeVisible();
});

test("US-10.2: content is capped at 1200px on a wide screen", async ({ browser }) => {
  await makeMember(DAVE);
  const page = await signedInPage(browser, DAVE, "./");
  await page.setViewportSize({ width: 1600, height: 900 });
  const search = page.getByPlaceholder("Search");
  await expect(search).toBeVisible();
  const box = await search.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(1200);
  // Centred: as much room on the left as on the right.
  expect(Math.abs((box?.x ?? 0) * 2 + (box?.width ?? 0) - 1600)).toBeLessThan(4);
});

test("US-10.3: the Data page is a centred 720px column", async ({ browser }) => {
  await makeMember(DAVE);
  const page = await signedInPage(browser, DAVE, "#/data");
  const column = page.getByRole("heading", { level: 1, name: "Data" }).locator("..");
  await expect(column.getByRole("heading", { name: "Import from Pepperplate" })).toBeVisible();

  const box = await column.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.width).toBeLessThanOrEqual(720);
  expect(Math.abs(box!.x * 2 + box!.width - viewport.width)).toBeLessThan(4);
});

test("US-10.4: the cookbook shows rows of ~210px cards and the A–Z list in columns", async ({
  browser,
}) => {
  await makeMember(DAVE);
  const titles = [
    "Apple Cake",
    "Beet Soup",
    "Carrot Salad",
    "Dill Potatoes",
    "Egg Bake",
    "Fish Pie",
  ];
  for (const [i, title] of titles.entries()) {
    await putDoc(`recipes/e2e-wide-${String(i)}`, recipe(title, ["1 tsp salt"]));
  }
  const page = await signedInPage(browser, DAVE, "./");
  const cards = titles.map((title) => page.getByRole("link", { name: title }));
  await expect(cards[0]!).toBeVisible();

  // More than two cards in the first row, each about 210px or a little wider.
  const boxes = await Promise.all(cards.slice(0, 4).map((card) => card.boundingBox()));
  const tops = boxes.map((box) => Math.round(box?.y ?? -1));
  expect(new Set(tops.slice(0, 3)).size).toBe(1);
  for (const box of boxes) {
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(210);
    expect(box?.width ?? 0).toBeLessThan(320);
  }

  await page.getByRole("radio", { name: "List" }).click();
  await expect(page.getByRole("list", { name: "Recipes" })).toHaveCSS("column-count", "3");
});

/** A 1×1 PNG: enough for the recipe page to lay out a photo. */
const PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

test("US-10.6: a recipe is a spread, and the ingredients stay in view while the method scrolls", async ({
  browser,
}) => {
  await makeMember(DAVE);
  const long = {
    ...recipe("Slow Stew", ["1 kg beef", "2 onions", "3 carrots"]),
    description: "A long, slow stew.",
    thumbnail: PHOTO,
    instructions: Array.from({ length: 30 }, (_, i) => ({
      text: `Step ${String(i + 1)}: stir, taste and wait a little longer before the next step.`,
    })),
  };
  await putDoc("recipes/e2e-slow-stew", long);
  const page = await signedInPage(browser, DAVE, "#/recipe/e2e-slow-stew");
  const ingredients = page.getByRole("list", { name: "Ingredients" });
  const method = page.getByRole("list", { name: "Method" });
  await expect(method).toBeVisible();

  const [photoBox, ingredientsBox, methodBox] = await Promise.all([
    page.getByRole("presentation").first().boundingBox(),
    ingredients.boundingBox(),
    method.boundingBox(),
  ]);
  expect(photoBox!.x + photoBox!.width).toBeLessThanOrEqual(ingredientsBox!.x);
  expect(ingredientsBox!.x + ingredientsBox!.width).toBeLessThanOrEqual(methodBox!.x);
  expect(Math.abs(ingredientsBox!.y - methodBox!.y)).toBeLessThan(40);

  // Scrolled to the very end, the photo hasn't moved and the ingredients are still in view.
  await page.mouse.wheel(0, 20_000);
  await expect(page.getByText("Step 30:")).toBeInViewport();
  await expect(ingredients).toBeInViewport();
  const photoAtEnd = await page.getByRole("presentation").first().boundingBox();
  expect(Math.abs(photoAtEnd!.y - photoBox!.y)).toBeLessThan(1);
  expect(photoAtEnd!.height).toBeCloseTo(photoBox!.height, 0);
});

test("US-10.6: a short recipe with a photo fits the screen, so nothing scrolls", async ({
  browser,
}) => {
  await makeMember(DAVE);
  await putDoc("recipes/e2e-toast", {
    ...recipe("Toast", ["1 slice bread"]),
    thumbnail: PHOTO,
    instructions: [{ text: "Toast the bread." }],
  });
  const page = await signedInPage(browser, DAVE, "#/recipe/e2e-toast");
  await expect(page.getByRole("list", { name: "Method" })).toBeVisible();
  const overflow = await page.evaluate(() => {
    const root = (
      globalThis as unknown as {
        document: { documentElement: { scrollHeight: number; clientHeight: number } };
      }
    ).document.documentElement;
    return root.scrollHeight - root.clientHeight;
  });
  expect(overflow).toBeLessThanOrEqual(1);
});

test("US-10.7: the grocery list is a centred 560px column, amounts next to the items", async ({
  browser,
}) => {
  await makeMember(DAVE);
  const page = await signedInPage(browser, DAVE, "#/groceries");
  const item = `cream ${String(Date.now())}`;
  await page.getByRole("textbox", { name: "Add an item" }).fill(`2 dl ${item}`);
  await page.getByRole("button", { name: "Add" }).click();
  const row = page.getByRole("listitem", { name: item });
  await expect(row).toHaveText(`${item} · 2 dl`);

  const box = await row.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.width).toBeLessThanOrEqual(560);
  expect(Math.abs(box!.x * 2 + box!.width - viewport.width)).toBeLessThan(4);
});

test("US-10.8: the roller is a week grid that wraps for a longer range", async ({ browser }) => {
  await makeMember(DAVE);
  for (const title of ["Roll Pasta", "Roll Soup", "Roll Salad", "Roll Tacos"]) {
    await putDoc(`recipes/e2e-${title.replace(" ", "-").toLowerCase()}`, recipe(title, ["1 egg"]));
  }
  const page = await signedInPage(browser, DAVE, "#/plan/roll?week=2026-11-02");
  // A roll from an earlier test in this window would be kept; start from a fresh one.
  const grid = page.getByLabel("Rolled days");
  const days = grid.getByRole("region");
  await expect(days).toHaveCount(7);
  const tops = await days.evaluateAll((cells) =>
    cells.map((cell) => Math.round((cell as unknown as { offsetTop: number }).offsetTop)),
  );
  expect(new Set(tops).size).toBe(1);

  await page.getByLabel("To").fill("2026-11-10");
  await expect(days).toHaveCount(9);
  const rows = await days.evaluateAll((cells) =>
    cells.map((cell) => Math.round((cell as unknown as { offsetTop: number }).offsetTop)),
  );
  expect(new Set(rows).size).toBe(2);

  await grid.getByRole("button", { name: "Lock Mon 2 Nov" }).click();
  await expect(grid.getByRole("button", { name: "Lock Mon 2 Nov" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("US-10.9: the Plan opens on the month, and a day's + adds to it", async ({ browser }) => {
  await makeMember(DAVE);
  await putDoc("recipes/e2e-month-pie", recipe("Month Pie", ["1 egg"]));
  await putDoc(`menu_days/${todayKey()}`, {
    entries: [{ id: "e2e-month", recipeId: "e2e-month-pie" }],
    updatedAt: new Date(),
  });
  const page = await signedInPage(browser, DAVE, "#/plan");
  const month = page.getByLabel("Month");
  await expect(month.getByRole("link", { name: "Month Pie" })).toBeVisible();
  expect(await month.getByRole("region").count()).toBeGreaterThanOrEqual(28);

  const today = month.locator('[aria-current="date"]');
  await today.getByRole("button", { name: /^Add to / }).click();
  const sheet = page.getByRole("dialog", { name: /^Add to / });
  await sheet.getByRole("tab", { name: "Note" }).click();
  const note = `Note ${String(Date.now())}`;
  await sheet.getByRole("textbox", { name: "Note" }).fill(note);
  await sheet.getByRole("textbox", { name: "Note" }).press("Enter");
  await expect(today.getByText(note)).toBeVisible();

  // The week is one click away.
  await page.getByRole("radio", { name: "Week" }).click();
  await expect(
    page.getByRole("region", { name: /Today/ }).or(page.locator('section[aria-current="date"]')),
  ).toBeVisible();
});

test("US-10.10: an entry dragged to another day in the month moves there", async ({ browser }) => {
  await makeMember(DAVE);
  await putDoc("recipes/e2e-drag-tart", recipe("Drag Tart", ["1 egg"]));
  await putDoc("menu_days/2031-04-25", { entries: [], updatedAt: new Date() });
  await putDoc("menu_days/2031-04-08", {
    entries: [{ id: "e2e-month-drag", recipeId: "e2e-drag-tart" }],
    updatedAt: new Date(),
  });
  const page = await signedInPage(browser, DAVE, "#/plan?view=month&month=2031-04");
  const tuesday = page.getByRole("region", { name: "Tue 8 Apr" });
  const friday = page.getByRole("region", { name: "Fri 25 Apr" });
  const tart = tuesday.getByRole("link", { name: "Drag Tart" });
  await expect(tart).toBeVisible();

  await dragTo(page, tart, friday, friday);
  await expect(friday.getByRole("link", { name: "Drag Tart" })).toBeVisible();
  await expect(tuesday.getByRole("link")).toHaveCount(0);
});
