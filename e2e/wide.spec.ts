// The wide layout (Epic 10), at iPad landscape size: only the `ipad-landscape` project runs this
// file. Each wide-layout story adds its page's check here.
import { expect, test } from "@playwright/test";
import { makeMember, signedInPage } from "./members.ts";
import { putDoc, recipe } from "./seed.ts";

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
