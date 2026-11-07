// US-9.2: phone fixes from the Epic 7 smoke test, checked in a real browser at phone size with a
// touch screen (the Pixel 7 profile has `pointer: coarse`, like an iPhone).
import { expect, test, type Page } from "@playwright/test";
import { makeMember, signedInPage } from "./members.ts";

const CAROL = "carol@example.com";

/** The browser's getComputedStyle; the e2e TypeScript config has no DOM types. */
type ComputedStyleOf = (element: unknown) => { fontSize: string };

/** The computed font sizes (px) of every Mantine text field on the page. */
const fieldSizes = (page: Page) =>
  page.locator(".mantine-Input-input").evaluateAll((fields) => {
    const styleOf = (globalThis as unknown as { getComputedStyle: ComputedStyleOf })
      .getComputedStyle;
    return fields.map((field) => parseFloat(styleOf(field).fontSize));
  });

test("a fresh start opens on the cookbook, with the menu closed", async ({ browser }) => {
  await makeMember(CAROL);
  const page = await signedInPage(browser, CAROL, "./");
  await expect(page.getByRole("heading", { name: "Cookbook" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
});

test("text fields are at least 16px on a touch screen, so iOS doesn't zoom in", async ({
  browser,
}) => {
  await makeMember(CAROL);
  // Signed in on the cookbook: the edit form has no menu button, which signedInPage waits for.
  const page = await signedInPage(browser, CAROL, "./");
  await page.goto("#/recipe/new");
  await expect(page.getByRole("textbox", { name: "Title" })).toBeVisible();
  const sizes = await fieldSizes(page);
  expect(sizes.length).toBeGreaterThan(3);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);

  // A field that was already larger, like the cookbook search (18px), keeps its own size.
  await page.goto("#/");
  await expect(page.getByPlaceholder("Search")).toHaveCSS("font-size", "18px");
});

test("the roller's Roll button stays on screen at the bottom of a long range", async ({
  browser,
}) => {
  await makeMember(CAROL);
  const page = await signedInPage(browser, CAROL, "#/plan/roll");
  const from = await page.getByLabel("From").inputValue();
  const last = new Date(`${from}T12:00:00`);
  last.setDate(last.getDate() + 20);
  const to = `${String(last.getFullYear())}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
  await page.getByLabel("To").fill(to);
  await expect(page.getByRole("region")).toHaveCount(21);

  await page.getByRole("region").last().scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Roll" })).toBeInViewport();
});
