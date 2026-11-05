import { parseExportFile } from "./exportFile.ts";

const validFile = {
  format: "recipe-app-export",
  version: 1,
  exportedAt: "2026-11-03T20:00:00.000Z",
  recipes: {
    pasta: {
      title: "Pasta",
      createdAt: "2026-11-03T19:00:00.000Z",
      updatedAt: "2026-11-03T19:30:00.000Z",
    },
  },
  recipeImages: { pasta: { data: "data:image/jpeg;base64,AAAA" } },
  menuDays: {
    "2026-11-04": {
      entries: [{ id: "a1", recipeId: "pasta" }],
      updatedAt: "2026-11-04T08:00:00.000Z",
    },
  },
};

function withChange(change: Record<string, unknown>): string {
  return JSON.stringify({ ...validFile, ...change });
}

describe("parseExportFile", () => {
  it("accepts a valid export", () => {
    expect(parseExportFile(JSON.stringify(validFile))).toEqual(validFile);
  });

  it.each([
    ["text that isn't JSON", "{ not json", "This file isn't valid JSON."],
    ["JSON that isn't an object", "[1, 2]", "This isn't a recipe-app export file."],
    [
      "another app's file",
      withChange({ format: "something-else" }),
      "This isn't a recipe-app export file.",
    ],
    [
      "a newer version",
      withChange({ version: 2 }),
      "This export is version 2, but this app can only restore version 1.",
    ],
    [
      "a missing section",
      JSON.stringify({ ...validFile, menuDays: undefined }),
      'The export file is damaged: "menuDays" is missing or not an object.',
    ],
    [
      "a document that isn't an object",
      withChange({ recipes: { pasta: "Pasta" } }),
      "The export file is damaged: recipes/pasta is not an object.",
    ],
    [
      "a recipe date that isn't a date",
      withChange({ recipes: { pasta: { ...validFile.recipes.pasta, createdAt: "yesterday" } } }),
      "The export file is damaged: recipes/pasta has an invalid createdAt.",
    ],
    [
      "a Plan day without its updatedAt (US-5.1)",
      withChange({ menuDays: { "2026-11-04": { entries: [] } } }),
      "The export file is damaged: menuDays/2026-11-04 has an invalid updatedAt.",
    ],
  ])("rejects %s", (_, text, message) => {
    expect(() => parseExportFile(text)).toThrow(message);
  });
});
