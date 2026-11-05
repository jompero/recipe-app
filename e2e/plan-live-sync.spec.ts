// US-5.5: live sync between two members on their own phones, through the real app and emulator.
import { expect, test, type Page } from "@playwright/test";
import { makeMember, signedInPage } from "./members.ts";

const ALICE = "alice@example.com";
const BOB = "bob@example.com";

/** Today's day on the Plan page (the week opens on today). */
const today = (page: Page) => page.locator('section[aria-current="date"]');

test("a note added on one phone appears on the other, and so does its removal", async ({
  browser,
}) => {
  await makeMember(ALICE);
  await makeMember(BOB);
  const alice = await signedInPage(browser, ALICE, "#/plan");
  const bob = await signedInPage(browser, BOB, "#/plan");
  const note = `Tacos ${String(Date.now())}`;
  await expect(today(bob)).toBeVisible();

  // Alice adds a note to today.
  await today(alice)
    .getByRole("button", { name: /^Add to / })
    .click();
  const sheet = alice.getByRole("dialog");
  await sheet.getByRole("tab", { name: "Note" }).click();
  await sheet.getByRole("textbox", { name: "Note" }).fill(note);
  await sheet.getByRole("button", { name: "Add" }).click();
  await expect(today(alice).getByText(note)).toBeVisible();

  // Bob sees it without reloading, and removes it.
  await expect(today(bob).getByText(note)).toBeVisible();
  await today(bob)
    .getByRole("button", { name: `Options for ${note}` })
    .click();
  await bob.getByRole("menuitem", { name: "Remove" }).click();
  await expect(today(bob).getByText(note)).toHaveCount(0);

  // Alice sees it go.
  await expect(today(alice).getByText(note)).toHaveCount(0);
});
