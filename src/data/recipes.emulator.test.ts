// Emulator test for src/data/recipes.ts (US-2.4), with the real firestore.rules loaded.
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import firestoreRules from "../../firestore.rules?raw";
import type { RecipeDraft } from "../parsing/types.ts";
import { loadFullImage } from "./images";
import { existingRecipeIds, loadAllRecipes, saveRecipes, type RecipeToSave } from "./recipes";

const { PROJECT_ID, MEMBER, HOST, PORT } = vi.hoisted(() => {
  const [host = "127.0.0.1", port = "8080"] = (
    (import.meta.env["FIRESTORE_EMULATOR_HOST"] as string | undefined) ?? "127.0.0.1:8080"
  ).split(":");
  return {
    // Its own project, so clearing data never touches the dev data or the other tests.
    PROJECT_ID: "demo-recipe-app-recipes-test",
    MEMBER: "member@example.com",
    HOST: host,
    PORT: Number(port),
  };
});

// The app's Firestore, swapped for one on the emulator that is signed in as an allowed member.
vi.mock("../config/firebase", async () => {
  const { initializeApp } = await import("firebase/app");
  const { connectFirestoreEmulator, getFirestore } = await import("firebase/firestore");
  const app = initializeApp({ projectId: PROJECT_ID }, "recipes-emulator-test");
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

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (admin) => {
    await admin.firestore().doc(`allowed_users/${MEMBER}`).set({});
  });
});

function draft(title: string): RecipeDraft {
  return {
    title,
    description: "",
    source: "Valdemarsro",
    sourceUrl: "",
    yield: "4 peeps",
    activeTime: "",
    totalTime: "30 min",
    tags: ["pasta"],
    ingredients: [{ raw: "400 g pasta", qty: 400, unit: "g", item: "pasta" }],
    instructions: [{ header: "Cook" }, { text: "Boil." }],
  };
}

function toSave(id: string, fullImage: string | null = null): RecipeToSave {
  return {
    id,
    recipe: draft(id),
    thumbnail: fullImage === null ? null : "data:image/jpeg;base64,THUMB",
    fullImage,
  };
}

describe("recipes data module", () => {
  test("saves recipes under the given IDs and reads them back", async () => {
    await saveRecipes([toSave("pasta", "data:image/jpeg;base64,FULL"), toSave("soup")]);

    const recipes = await loadAllRecipes();

    expect(recipes.map((recipe) => recipe.id).sort()).toEqual(["pasta", "soup"]);
    const pasta = recipes.find((recipe) => recipe.id === "pasta");
    expect(pasta).toMatchObject({
      ...draft("pasta"),
      thumbnail: "data:image/jpeg;base64,THUMB",
      hasImage: true,
      archived: false,
    });
    expect(pasta?.createdAt).toBeInstanceOf(Date);
    expect(pasta?.updatedAt).toBeInstanceOf(Date);
    expect(recipes.find((recipe) => recipe.id === "soup")).toMatchObject({
      thumbnail: null,
      hasImage: false,
    });
    expect(await loadFullImage("pasta")).toBe("data:image/jpeg;base64,FULL");
    expect(await loadFullImage("soup")).toBeNull();
  });

  test("saving again under the same ID replaces the recipe instead of duplicating it", async () => {
    await saveRecipes([toSave("pasta")]);
    await saveRecipes([{ ...toSave("pasta"), recipe: draft("Better pasta") }]);

    const recipes = await loadAllRecipes();

    expect(recipes).toHaveLength(1);
    expect(recipes[0]?.title).toBe("Better pasta");
  });

  test("splits more than 10 MiB of images across batches and reports progress", async () => {
    // 12 images at the 900,000-character cap: ~10.8 MB, over the 10 MiB request limit.
    const recipes = Array.from({ length: 12 }, (_, i) =>
      toSave(`big-${i}`, `data:image/jpeg;base64,${"A".repeat(899_970)}`),
    );
    const progress: [number, number][] = [];

    await saveRecipes(recipes, (saved, total) => progress.push([saved, total]));

    expect(await loadAllRecipes()).toHaveLength(12);
    expect(progress.length).toBeGreaterThan(1);
    expect(progress.at(-1)).toEqual([12, 12]);
    expect(progress.map(([saved]) => saved)).toEqual(
      [...progress.map(([s]) => s)].sort((a, b) => a - b),
    );
  }, 60_000);

  test("saves many small recipes in one go despite the rules' per-request lookup limit", async () => {
    // Every write runs isMember(), an exists() lookup; a batch is limited to 20 lookups.
    const recipes = Array.from({ length: 60 }, (_, i) => toSave(`small-${i}`));

    await saveRecipes(recipes);

    expect(await loadAllRecipes()).toHaveLength(60);
  });

  test("finds which of the given IDs already exist, in more than one chunk of 30", async () => {
    await saveRecipes([toSave("pasta"), toSave("soup"), toSave("id-44")]);
    const asked = ["pasta", "nope", "soup", ...Array.from({ length: 45 }, (_, i) => `id-${i}`)];

    expect((await existingRecipeIds(asked)).sort()).toEqual(["id-44", "pasta", "soup"]);
  });

  test("finds no existing IDs when asked about none", async () => {
    expect(await existingRecipeIds([])).toEqual([]);
  });
});
