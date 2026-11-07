import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Relative, so one build works at jompero.github.io/recipe-app/ and recipes.danijompero.com/
  // alike: hash routing means only index.html is ever served (ADR-0004, amended in EPIC-8).
  base: "./",
  server: {
    watch: {
      // Large local data, never imported by the app. Watching it is wasted work, and on Windows a
      // file still being written (e.g. a ~35 MB export) makes the watcher fail with EBUSY.
      // Added to Vite's own ignore list (.git, node_modules, …), not replacing it.
      ignored: ["**/.scratch/**", "**/.emulator-data/**", "**/docs/pepperplate-data/**"],
    },
  },
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
