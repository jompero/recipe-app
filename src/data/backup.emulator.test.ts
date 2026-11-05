// Emulator test for src/data/backup.ts (US-2.6), with the real firestore.rules loaded, so every
// restored document must pass them.
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import firestoreRules from "../../firestore.rules?raw";
import type { ExportFile } from "../backup/exportFile.ts";
import type { RecipeDraft } from "../parsing/types.ts";
import { exportEverything, restoreEverything } from "./backup";
import { loadAllRecipes, saveRecipes } from "./recipes";

const { PROJECT_ID, MEMBER, HOST, PORT } = vi.hoisted(() => {
  const [host = "127.0.0.1", port = "8080"] = (
    (import.meta.env["FIRESTORE_EMULATOR_HOST"] as string | undefined) ?? "127.0.0.1:8080"
  ).split(":");
  return {
    // Its own project, so clearing data never touches the dev data or the other tests.
    PROJECT_ID: "demo-recipe-app-backup-test",
    MEMBER: "member@example.com",
    HOST: host,
    PORT: Number(port),
  };
});

// The app's Firestore, swapped for one on the emulator that is signed in as an allowed member.
vi.mock("../config/firebase", async () => {
  const { initializeApp } = await import("firebase/app");
  const { connectFirestoreEmulator, getFirestore } = await import("firebase/firestore");
  const app = initializeApp({ projectId: PROJECT_ID }, "backup-emulator-test");
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, PORT, {
    mockUserToken: { sub: "member", email: MEMBER, email_verified: true },
  });
  return { db };
});

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: HOST, port: PORT, rules: firestoreRules },
  });
});

afterAll(async () => {
  await env.cleanup();
});

async function emptyDatabase() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (admin) => {
    await admin.firestore().doc(`allowed_users/${MEMBER}`).set({});
  });
}

beforeEach(emptyDatabase);

function draft(title: string): RecipeDraft {
  return {
    title,
    description: "Notes:\nkeep the line breaks",
    source: "Valdemarsro",
    sourceUrl: "https://example.com",
    yield: "4 peeps",
    activeTime: "",
    totalTime: "30 min",
    tags: ["pasta", "quick"],
    ingredients: [
      { header: "Sauce" },
      { raw: "1-2 cloves garlic", qty: 1, qtyMax: 2, unit: "clove", item: "garlic" },
      { raw: "Salt", item: "Salt" },
    ],
    instructions: [{ text: "Boil." }],
  };
}

async function fillDatabase() {
  await saveRecipes([
    {
      id: "pasta",
      recipe: draft("Pasta"),
      thumbnail: "data:image/jpeg;base64,T",
      fullImage: "data:image/jpeg;base64,F",
    },
    { id: "soup", recipe: draft("Soup"), thumbnail: null, fullImage: null },
  ]);
  await env.withSecurityRulesDisabled(async (admin) => {
    await admin
      .firestore()
      .doc("menu_days/2026-11-04")
      .set({
        entries: [{ id: "a1", recipeId: "pasta" }],
        updatedAt: new Date("2026-11-04T08:00:00.000Z"),
      });
  });
}

/** An export without its exportedAt, which naturally differs between runs. */
function contentOf(file: ExportFile) {
  return { ...file, exportedAt: "(ignored)" };
}

describe("backup data module", () => {
  test("exports every recipe, image and menu day, with dates as ISO strings", async () => {
    await fillDatabase();

    const file = await exportEverything();

    expect(file).toMatchObject({ format: "recipe-app-export", version: 1 });
    expect(Object.keys(file.recipes).sort()).toEqual(["pasta", "soup"]);
    expect(file.recipes["pasta"]).toMatchObject({
      ...draft("Pasta"),
      hasImage: true,
      archived: false,
    });
    expect(file.recipes["pasta"]?.["createdAt"]).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
    expect(file.recipeImages).toEqual({ pasta: { data: "data:image/jpeg;base64,F" } });
    expect(file.menuDays).toEqual({
      "2026-11-04": {
        entries: [{ id: "a1", recipeId: "pasta" }],
        updatedAt: "2026-11-04T08:00:00.000Z",
      },
    });
    expect(Date.parse(file.exportedAt)).not.toBeNaN();
  });

  test("restoring an export into an empty database gives back the same documents, dates included", async () => {
    await fillDatabase();
    const exported = await exportEverything();
    await emptyDatabase();

    await restoreEverything(exported);

    expect(contentOf(await exportEverything())).toEqual(contentOf(exported));
  });

  test("restore replaces documents in the file and never touches the others", async () => {
    await fillDatabase();
    const exported = await exportEverything();
    await saveRecipes([
      { id: "pasta", recipe: draft("Changed pasta"), thumbnail: null, fullImage: null },
      { id: "added-later", recipe: draft("Added later"), thumbnail: null, fullImage: null },
    ]);

    await restoreEverything(exported);

    const recipes = await loadAllRecipes();
    expect(recipes.map((recipe) => recipe.id).sort()).toEqual(["added-later", "pasta", "soup"]);
    expect(recipes.find((recipe) => recipe.id === "pasta")?.title).toBe("Pasta");
    expect(recipes.find((recipe) => recipe.id === "added-later")?.title).toBe("Added later");
  });

  test("reports progress up to the number of documents in the file", async () => {
    await fillDatabase();
    const exported = await exportEverything();
    const progress: [number, number][] = [];

    await restoreEverything(exported, (done, total) => progress.push([done, total]));

    // 2 recipes + 1 image + 1 menu day
    expect(progress.at(-1)).toEqual([4, 4]);
  });
});
