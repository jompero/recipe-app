// The wide layout (Epic 10), at iPad landscape size: only the `ipad-landscape` project runs this
// file. Each wide-layout story adds its page's check here.
import { expect, test } from "@playwright/test";
import { makeMember, signedInPage } from "./members.ts";

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
