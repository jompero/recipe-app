// US-9.5: the offline strip and the offline copy in a real browser, against the emulator. The dev
// server has no service worker, so this covers the data side, not opening the app offline.
import { expect, test } from "@playwright/test";
import { makeMember, signedInPage } from "./members.ts";
import { putDoc, recipe } from "./seed.ts";

const DAVE = "dave@example.com";

test("offline, the strip shows and recipes still open; back online, it goes away", async ({
  browser,
}) => {
  await makeMember(DAVE);
  await putDoc("recipes/e2e-flatbread", recipe("E2E Flatbread", ["3 dl flour", "2 dl water"]));
  const page = await signedInPage(browser, DAVE, "./");
  const offline = page.getByRole("status", { name: "Offline" });
  await expect(page.getByRole("link", { name: /E2E Flatbread/ })).toBeVisible();
  await expect(offline).toHaveCount(0);

  await page.context().setOffline(true);
  await expect(offline).toContainText("changes will sync when you're back online");
  await page.getByRole("link", { name: /E2E Flatbread/ }).click();
  await expect(page.getByRole("heading", { name: "E2E Flatbread" })).toBeVisible();
  await expect(page.getByText("3 dl flour")).toBeVisible();

  await page.context().setOffline(false);
  await expect(offline).toHaveCount(0);
});
