// US-6.5: the grocery list shared between two members on their own phones, through the real app
// and emulator. The list is built from a seeded Plan day with the builder (US-6.4).
import { expect, test } from "@playwright/test";
import { makeMember, signedInPage } from "./members.ts";
import { putDoc, recipe, todayKey } from "./seed.ts";

const ALICE = "alice@example.com";
const BOB = "bob@example.com";

test("ticks and added items on the grocery list show on the other phone", async ({ browser }) => {
  await makeMember(ALICE);
  await makeMember(BOB);
  await putDoc("recipes/e2e-pancakes", recipe("E2E Pancakes", ["2 dl milk", "1 egg"]));
  await putDoc(`menu_days/${todayKey()}`, {
    entries: [{ id: "e2e-entry", recipeId: "e2e-pancakes" }],
    updatedAt: new Date(),
  });

  // Alice builds the list from this week's Plan (today is in the default range).
  const alice = await signedInPage(browser, ALICE, "#/groceries/new");
  await expect(alice.getByRole("checkbox", { name: "E2E Pancakes" })).toBeChecked();
  await alice.getByRole("button", { name: "Build list" }).click();
  // A list from an earlier test in this run would bring up Replace / Add.
  const replace = alice.getByRole("button", { name: "Replace" });
  if (await replace.isVisible()) await replace.click();
  const aliceMilk = alice.getByRole("listitem", { name: "milk" });
  await expect(aliceMilk).toContainText("2 dl");

  const bob = await signedInPage(browser, BOB, "#/groceries");
  const bobMilk = bob.getByRole("listitem", { name: "milk" });
  await expect(bobMilk).toBeVisible();

  // Alice ticks the milk; Bob sees it ticked.
  await aliceMilk.getByRole("checkbox").click();
  await expect(bobMilk.getByRole("checkbox")).toBeChecked();

  // Bob adds an item; Alice sees it.
  const item = `Paper ${String(Date.now())}`;
  await bob.getByRole("textbox", { name: "Add an item" }).fill(item);
  await bob.getByRole("button", { name: "Add" }).click();
  await expect(alice.getByRole("listitem", { name: item })).toBeVisible();
});
