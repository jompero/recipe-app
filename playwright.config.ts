// End-to-end tests (US-5.5): the real app in Chromium at phone size, against the emulator, plus
// the wide layout's checks at iPad landscape size (US-10.2).
//   npm run e2e     starts empty Auth + Firestore emulators, then runs these tests
// Not while `npm run dev:all` is running: the emulator ports (8080, 9099) are fixed.
import { defineConfig, devices } from "@playwright/test";

const PORT = 5174; // not the dev server's 5173, so a running `npm run dev` doesn't get in the way
const BASE_URL = `http://localhost:${String(PORT)}/`;
const CI = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "e2e",
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: 1,
  globalTimeout: 10 * 60 * 1000,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    // Everything runs at phone size, except the wide layout's own checks.
    { name: "phone-chromium", use: { ...devices["Pixel 7"] }, testIgnore: /wide\.spec\.ts$/ },
    // The wide layout (Epic 10): iPad landscape size with a touch screen, in Chromium (CI installs
    // only Chromium; Playwright's iPad profiles are WebKit). Only e2e/wide.spec.ts runs here.
    {
      name: "ipad-landscape",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1180, height: 820 },
        hasTouch: true,
      },
      testMatch: /wide\.spec\.ts$/,
    },
  ],
  webServer: {
    command: `npx vite --port ${String(PORT)} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    // The same dummy values as .env.example, so CI (which has no .env) runs against the emulator.
    env: {
      VITE_USE_EMULATOR: "true",
      VITE_FIREBASE_API_KEY: "demo-key",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-recipe-app.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "demo-recipe-app",
      VITE_FIREBASE_APP_ID: "demo-app",
    },
  },
});
