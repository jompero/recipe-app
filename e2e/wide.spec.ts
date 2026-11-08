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
