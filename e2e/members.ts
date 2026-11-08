// Helpers for end-to-end tests: members and sign-in, through the Firebase emulators.
import { expect, type Browser, type Page } from "@playwright/test";

const PROJECT_ID = "demo-recipe-app";
const FIRESTORE = `http://${process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8080"}`;

/**
 * Puts the email on the allowlist (allowed_users/{email}). Uses the emulator's REST API as the
 * owner, which skips the rules: the app itself can never write there.
 */
export async function makeMember(email: string): Promise<void> {
  const url = `${FIRESTORE}/v1/projects/${PROJECT_ID}/databases/(default)/documents/allowed_users/${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields: {} }),
  });
  if (!response.ok) throw new Error(`Couldn't add ${email}: ${await response.text()}`);
}

/**
 * A new browser window (its own storage, like another phone), signed in as `email` through the
 * Auth emulator's stand-in for the Google popup, and open at `path`.
 */
export async function signedInPage(browser: Browser, email: string, path: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(path);

  const popupOpened = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Sign in with Google" }).click();
  const popup = await popupOpened;
  await popup.waitForLoadState();
  // The emulator's page lists accounts it already knows; a new one is added with this button.
  // Once it lists an account, a click that lands before its script is ready does nothing and
  // the form stays hidden (seen in CI on the second window), so click again until it shows.
  const emailInput = popup.locator("#email-input");
  await expect(async () => {
    if (!(await emailInput.isVisible())) await popup.locator("#add-account-button").click();
    await expect(emailInput).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  await emailInput.fill(email);
  await popup.locator("#display-name-input").fill(email.split("@")[0] ?? email);
  await popup.locator("#sign-in").click();

  // Signed in: the member shell shows, as the bottom button (phone) or the top bar (wide).
  await expect(
    page
      .getByRole("button", { name: "Menu" })
      .or(page.getByRole("navigation", { name: "Sections" })),
  ).toBeVisible();
  return page;
}
