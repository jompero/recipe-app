// Parses the real Pepperplate export with the app's parser (US-2.1). The files are gitignored, so this skips in CI and on fresh
// clones; it exists to catch surprises in the real data that hand-written cases miss.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseRecipeText } from "../src/parsing/recipeText.ts";

const folder = join(process.cwd(), "docs", "pepperplate-data", "pepperplate_recipes");
const files = existsSync(folder) ? readdirSync(folder).filter((name) => name.endsWith(".txt")) : [];

describe.skipIf(files.length === 0)("the real Pepperplate export", () => {
  const parsed = files.map((name) => ({
    name,
    ...parseRecipeText(readFileSync(join(folder, name), "utf8")),
  }));

  it("has all 198 recipes", () => {
    expect(parsed).toHaveLength(198);
  });

  it("warns only about the recipes known to be incomplete", () => {
    const withWarnings = parsed
      .filter((recipe) => recipe.warnings.length > 0)
      .map((recipe) => `${recipe.name}: ${recipe.warnings.join(", ")}`);

    // Checked by hand: these have an empty Instructions block. FinnishPotatoSalad's steps are
    // written inside its description. Everything else has a title, ingredients and steps.
    expect(withWarnings).toEqual([
      "Bagels.txt: No instructions",
      "BreadDay.txt: No instructions",
      "CrispyRiceBalls.txt: No instructions",
      "FinnishPotatoSalad.txt: No instructions",
      "FishSticks.txt: No instructions",
    ]);
  });

  it("keeps the longest Notes block whole, from its first line to the end of the file", () => {
    // Its Description is empty, so the notes become the whole description.
    const blueberry = parsed.find((recipe) => recipe.name === "BlueberryOatmealMuffins.txt");

    expect(blueberry?.recipe.description).toMatch(/^Make Ahead Instructions:/);
    expect(blueberry?.recipe.description).toMatch(/Nutrition: .*protein each\.$/);
  });

  it("imports the 50 recipes' categories as tags", () => {
    expect(parsed.filter((recipe) => recipe.recipe.tags.length > 0)).toHaveLength(50);
  });

  it("never leaks a header or Notes line into the ingredients or steps", () => {
    const leaks = parsed.flatMap(({ name, recipe }) =>
      [...recipe.ingredients, ...recipe.instructions]
        .map((line) => ("raw" in line ? line.raw : "text" in line ? line.text : line.header))
        .filter((line) =>
          /^(Title|Description|Source|Original URL|Yield|Active|Total|Categories|Image|Notes|Ingredients|Instructions):/.test(
            line,
          ),
        )
        .map((line) => `${name}: ${line}`),
    );

    expect(leaks).toEqual([]);
  });
});
