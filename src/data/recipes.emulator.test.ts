// Emulator test for src/data/recipes.ts (US-2.4, US-4.1), with the real firestore.rules loaded.
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import firestoreRules from "../../firestore.rules?raw";
import type { RecipeDraft } from "../parsing/types.ts";
import { loadFullImage } from "./images";
import {
  createRecipe,
  existingRecipeIds,
  loadAllRecipes,
  saveRecipes,
  setArchived,
  updateRecipe,
  watchRecipes,
  type RecipeToSave,
  type StoredRecipe,
} from "./recipes";

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

describe("live recipe list", () => {
  const ids = (recipes: StoredRecipe[]) =>
    recipes
      .map((recipe) => recipe.id)
      .sort()
      .join(",");

  /** Collects every delivery; `next(check)` waits for one that passes the check. */
  function watch() {
    const deliveries: StoredRecipe[][] = [];
    const stop = watchRecipes((recipes) => deliveries.push(recipes));
    const next = (check: (recipes: StoredRecipe[]) => boolean) =>
      vi.waitFor(
        () => {
          const match = deliveries.find(check);
          if (!match) throw new Error("not delivered yet");
          return match;
        },
        { timeout: 5000 },
      );
    return { stop, next };
  }

  test("delivers all recipes, then again after a change", async () => {
    await saveRecipes([toSave("pasta"), toSave("soup")]);
    const { stop, next } = watch();

    // Exact IDs, not counts: the client cache can briefly deliver documents from earlier tests.
    await next((recipes) => ids(recipes) === "pasta,soup");

    await saveRecipes([toSave("stew")]);
    const second = await next((recipes) => ids(recipes) === "pasta,soup,stew");
    // A just-saved recipe has an estimated date, not 1970, before the server sets it.
    expect(second.find((recipe) => recipe.id === "stew")?.createdAt.getFullYear()).toBeGreaterThan(
      2000,
    );

    stop();
  });
});

describe("archive", () => {
  const find = async (id: string) => (await loadAllRecipes()).find((recipe) => recipe.id === id);

  test("archiving and unarchiving pass the rules and move the updated date", async () => {
    await saveRecipes([toSave("pasta")]);
    const before = await find("pasta");

    await setArchived("pasta", true);
    const archived = await find("pasta");
    expect(archived?.archived).toBe(true);
    expect(archived?.updatedAt.getTime()).toBeGreaterThan(before?.updatedAt.getTime() ?? 0);
    // Nothing else changes.
    expect(archived).toMatchObject({ ...draft("pasta"), createdAt: before?.createdAt });

    await setArchived("pasta", false);
    expect((await find("pasta"))?.archived).toBe(false);
  });

  test("archiving a recipe that doesn't exist fails", async () => {
    await expect(setArchived("nope", true)).rejects.toThrow();
  });
});

describe("editing", () => {
  const find = async (id: string) => (await loadAllRecipes()).find((recipe) => recipe.id === id);

  test("saving an edit replaces the text and keeps the photo, archive flag and creation date", async () => {
    await saveRecipes([toSave("pasta", "data:image/jpeg;base64,FULL")]);
    await setArchived("pasta", true);
    const before = await find("pasta");

    const edited = { ...draft("Better pasta"), tags: ["pasta", "quick"], ingredients: [] };
    await updateRecipe("pasta", edited);

    const after = await find("pasta");
    expect(after).toMatchObject({
      ...edited,
      thumbnail: "data:image/jpeg;base64,THUMB",
      hasImage: true,
      archived: true,
      createdAt: before?.createdAt,
    });
    expect(after?.updatedAt.getTime()).toBeGreaterThan(before?.updatedAt.getTime() ?? 0);
    expect(await loadFullImage("pasta")).toBe("data:image/jpeg;base64,FULL");
  });

  test("an edit can't create a recipe that doesn't exist", async () => {
    await expect(updateRecipe("nope", draft("Nope"))).rejects.toThrow();
  });

  test("the rules still refuse a recipe without a title", async () => {
    await saveRecipes([toSave("pasta")]);
    await expect(updateRecipe("pasta", draft(""))).rejects.toThrow();
  });

  test("a new recipe gets its own ID and the defaults", async () => {
    const id = await createRecipe(draft("Toast"));

    expect(id).toMatch(/^[A-Za-z0-9]{20}$/);
    const toast = await find(id);
    expect(toast).toMatchObject({
      ...draft("Toast"),
      thumbnail: null,
      hasImage: false,
      archived: false,
    });
    expect(toast?.createdAt.getFullYear()).toBeGreaterThan(2000);
  });
});

describe("photos (US-4.1)", () => {
  const find = async (id: string) => (await loadAllRecipes()).find((recipe) => recipe.id === id);
  const photo = (name: string) => ({
    thumbnail: `data:image/jpeg;base64,THUMB-${name}`,
    full: `data:image/jpeg;base64,FULL-${name}`,
  });

  test("a new recipe with a photo saves both documents", async () => {
    const id = await createRecipe(draft("Toast"), photo("toast"));

    expect(id).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(await find(id)).toMatchObject({
      ...draft("Toast"),
      thumbnail: "data:image/jpeg;base64,THUMB-toast",
      hasImage: true,
      archived: false,
    });
    expect(await loadFullImage(id)).toBe("data:image/jpeg;base64,FULL-toast");
  });

  test("an existing recipe without a photo gets one", async () => {
    await saveRecipes([toSave("pasta")]);

    await updateRecipe("pasta", draft("Pasta with a photo"), photo("new"));

    expect(await find("pasta")).toMatchObject({
      title: "Pasta with a photo",
      thumbnail: "data:image/jpeg;base64,THUMB-new",
      hasImage: true,
    });
    expect(await loadFullImage("pasta")).toBe("data:image/jpeg;base64,FULL-new");
  });

  test("a photo is replaced", async () => {
    await saveRecipes([toSave("pasta", "data:image/jpeg;base64,FULL")]);

    await updateRecipe("pasta", draft("pasta"), photo("better"));

    expect(await find("pasta")).toMatchObject({
      thumbnail: "data:image/jpeg;base64,THUMB-better",
      hasImage: true,
    });
    expect(await loadFullImage("pasta")).toBe("data:image/jpeg;base64,FULL-better");
  });

  test("a photo is removed: the image document goes, the recipe stays", async () => {
    await saveRecipes([toSave("pasta", "data:image/jpeg;base64,FULL")]);

    await updateRecipe("pasta", draft("pasta"), "remove");

    expect(await find("pasta")).toMatchObject({
      ...draft("pasta"),
      thumbnail: null,
      hasImage: false,
    });
    expect(await loadFullImage("pasta")).toBeNull();
  });

  test("a text-only save leaves the photo alone", async () => {
    await saveRecipes([toSave("pasta", "data:image/jpeg;base64,FULL")]);

    await updateRecipe("pasta", draft("Renamed"), "keep");

    expect(await find("pasta")).toMatchObject({
      title: "Renamed",
      thumbnail: "data:image/jpeg;base64,THUMB",
      hasImage: true,
    });
    expect(await loadFullImage("pasta")).toBe("data:image/jpeg;base64,FULL");
  });

  test("a photo can't be added to a recipe that doesn't exist", async () => {
    await expect(updateRecipe("nope", draft("Nope"), photo("x"))).rejects.toThrow();
    expect(await loadFullImage("nope")).toBeNull();
  });
});
