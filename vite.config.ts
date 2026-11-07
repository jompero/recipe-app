import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

/** The app's page background (Mantine's light body), also the page's theme-color (index.html). */
const PAGE_COLOUR = "#ffffff";

export default defineConfig({
  plugins: [
    react(),
    // Installable app (EPIC-9, ADR-0009). The service worker precaches only this build's own files
    // and has no runtime caching, so Firestore, Firebase Auth and Google requests go straight to
    // the network: Firestore's own offline copy is the data cache. Paths stay relative (the
    // plugin keeps base "./"), so the github.io fallback installs too. Off in dev, so the dev
    // server and e2e run without a service worker.
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        name: "Family Recipes",
        short_name: "Recipes",
        description: "The family cookbook, meal plan and grocery list.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        theme_color: PAGE_COLOUR,
        background_color: PAGE_COLOUR,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          // Drawn inside the safe zone (docs/project/app-icon.md); iOS ignores maskable.
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,svg,png}"],
        // The bundled fonts ship every script; the recipes only need Latin. A font left out here
        // still loads online when needed (the browser asks only for the scripts on the page).
        globIgnores: ["**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
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
