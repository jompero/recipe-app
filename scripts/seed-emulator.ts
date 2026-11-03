// Fills the running Firestore emulator, so a fresh clone or a wiped emulator is one command from a
// usable app. Safe to re-run.
//
//   npm run seed        (with `npm run emulators` running; `npm run dev:all` runs it for you)
//
// 1. Fake allowlist members (always written). Fake @example.com addresses only: real member
//    emails never go in the repo (ADR-0002).
// 2. The base data (US-2.7): every recipe, photo and menu day from the gitignored export file
//    below, but only if the emulator has no recipes yet, so edits made in the emulator survive
//    restarts. To start over from the base data, wipe the emulator first.
//
// Uses the emulator's REST API with the "owner" token, which bypasses security rules.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseExportFile } from "../src/backup/exportFile.ts";
import { hasRecipes, loadBaseData } from "./seed/baseData.ts";

const PROJECT_ID = "demo-recipe-app";
const host = process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8080";
const BASE_DATA = path.resolve(import.meta.dirname, "../.scratch/base-data/recipes-export.json");

/** Sign in with one of these (via the emulator's fake Google popup) to be a member. */
const SEED_MEMBERS = ["member@example.com", "alex@example.com"];

async function setDocument(path: string, fields: Record<string, unknown> = {}): Promise<void> {
  const url = `http://${host}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) {
    throw new Error(`PATCH ${path} failed: HTTP ${response.status} ${await response.text()}`);
  }
}

async function seedBaseData(): Promise<void> {
  const target = { host, projectId: PROJECT_ID };
  if (!existsSync(BASE_DATA)) {
    console.log(
      [
        "No base data, so no recipes were added. To create it:",
        "  1. In the app, open Data and import the Pepperplate folders (or restore an export).",
        "  2. Click Export everything.",
        `  3. Save the file as ${path.relative(process.cwd(), BASE_DATA)}`,
      ].join("\n"),
    );
    return;
  }
  if (await hasRecipes(target)) {
    console.log("Recipes are already there, so the base data was skipped (edits are kept).");
    return;
  }

  const file = parseExportFile(readFileSync(BASE_DATA, "utf8"));
  let lastReported = 0;
  await loadBaseData(file, target, (done, total) => {
    if (done === total || done - lastReported >= 50) {
      lastReported = done;
      console.log(`Base data: ${done} of ${total} documents`);
    }
  });
  console.log(
    `Loaded ${Object.keys(file.recipes).length} recipes, ${Object.keys(file.recipeImages).length} photos and ${Object.keys(file.menuDays).length} menu days from the base data.`,
  );
}

async function main(): Promise<void> {
  for (const email of SEED_MEMBERS) {
    await setDocument(`allowed_users/${encodeURIComponent(email)}`);
    console.log(`allowed_users/${email}`);
  }
  console.log(`Seeded ${SEED_MEMBERS.length} members into the emulator at ${host}.`);
  await seedBaseData();
}

main().catch((error: unknown) => {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  console.error(
    cause.includes("ECONNREFUSED")
      ? `Can't reach the Firestore emulator at ${host}. Start it first with: npm run emulators`
      : error,
  );
  process.exitCode = 1;
});
