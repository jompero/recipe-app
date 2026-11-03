import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Must equal the GitHub repo name, or every asset 404s on GitHub Pages (ADR-0004).
  base: "/recipe-app/",
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "app",
          environment: "jsdom",
          setupFiles: "./vitest.setup.ts",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.emulator.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "scripts",
          environment: "node",
          include: ["scripts/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          // Needs the Firestore emulator: npm run test:ci, or npm run emulators in another terminal.
          name: "rules",
          environment: "node",
          include: ["tests/rules/**/*.test.ts"],
          testTimeout: 15_000,
          hookTimeout: 30_000,
        },
      },
      {
        extends: true,
        test: {
          // src/data modules against the Firestore emulator, with the real rules loaded.
          // Needs the emulator, like "rules".
          name: "emulator",
          environment: "node",
          include: ["src/**/*.emulator.test.ts"],
          testTimeout: 15_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
