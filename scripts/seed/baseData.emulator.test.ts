// Emulator round trip for the base-data seed (US-2.7): load a small export through the seed code,
// read it back with rules disabled, and compare.
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import type { ExportFile } from "../../src/backup/exportFile.ts";
import { hasRecipes, loadBaseData } from "./baseData.ts";

const PROJECT_ID = "demo-recipe-app-seed-test";
const HOST = process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8080";

let env: RulesTestEnvironment;

beforeAll(async () => {
  const [host = "127.0.0.1", port = "8080"] = HOST.split(":");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host, port: Number(port) },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

const file: ExportFile = {
  format: "recipe-app-export",
  version: 1,
  exportedAt: "2026-11-03T23:20:52.293Z",
  recipes: {
    pasta: {
      title: "Pasta",
      description: "Line one\nLine two",
      tags: ["pasta"],
      ingredients: [
        { header: "Sauce" },
        { raw: "1 1/2 dl cream", qty: 1.5, unit: "dl", item: "cream" },
        { raw: "400 g pasta", qty: 400, unit: "g", item: "pasta" },
      ],
      instructions: [{ text: "Boil." }],
      thumbnail: null,
      hasImage: true,
      archived: false,
      createdAt: "2026-11-03T19:00:00.123Z",
      updatedAt: "2026-11-03T19:30:00.000Z",
    },
  },
  recipeImages: { pasta: { data: "data:image/jpeg;base64,AAAA" } },
  menuDays: { "2026-11-04": { entries: [{ recipeId: "pasta", slot: "dinner" }] } },
};

async function readBack(path: string): Promise<Record<string, unknown> | undefined> {
  let data: Record<string, unknown> | undefined;
  await env.withSecurityRulesDisabled(async (context) => {
    data = (await context.firestore().doc(path).get()).data();
  });
  return data;
}

describe("loadBaseData", () => {
  test("writes every document in the file, with dates as timestamps", async () => {
    const progress: number[] = [];

    await loadBaseData(file, { host: HOST, projectId: PROJECT_ID }, (done) => progress.push(done));

    const pasta = await readBack("recipes/pasta");
    const { createdAt, updatedAt, ...rest } = pasta ?? {};
    const {
      createdAt: fileCreatedAt,
      updatedAt: fileUpdatedAt,
      ...fileRest
    } = file.recipes["pasta"] ?? {};
    expect(rest).toEqual(fileRest);
    expect((createdAt as { toDate(): Date }).toDate().toISOString()).toBe(fileCreatedAt);
    expect((updatedAt as { toDate(): Date }).toDate().toISOString()).toBe(fileUpdatedAt);
    expect(await readBack("recipe_images/pasta")).toEqual({ data: "data:image/jpeg;base64,AAAA" });
    expect(await readBack("menu_days/2026-11-04")).toEqual(file.menuDays["2026-11-04"]);
    expect(progress.at(-1)).toBe(3);
  });

  test("can tell whether the emulator has any recipes yet", async () => {
    const target = { host: HOST, projectId: PROJECT_ID };
    expect(await hasRecipes(target)).toBe(false);

    await loadBaseData(file, target);

    expect(await hasRecipes(target)).toBe(true);
  });

  test("replaces a document that's already there", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .doc("recipes/pasta")
        .set({ title: "Old", extra: "gone after seed" });
    });

    await loadBaseData(file, { host: HOST, projectId: PROJECT_ID });

    const pasta = await readBack("recipes/pasta");
    expect(pasta?.["title"]).toBe("Pasta");
    expect(pasta).not.toHaveProperty("extra");
  });
});
