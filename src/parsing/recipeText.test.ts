import { parseRecipeText } from "./recipeText.ts";

/** Builds a Pepperplate file the way the export writes them: CRLF, tab-indented block lines. */
function pepperplate(lines: string[]): string {
  return lines.join("\r\n") + "\r\n";
}

const pastaFile = pepperplate([
  "Title: 15 Min Pulled Oats & Mushroom Pasta",
  "Description: ",
  "Source: Valdemarsro",
  "Original URL: https://example.com/pasta",
  "Yield: 4 peeps",
  "Active: 15 mins",
  "Total: 30 min",
  "Image: https://cdn2.pepperplate.com/recipes/3a8301de487147e78a1ad2cc2e9fb385.jpg",
  "Ingredients:",
  "\t400 g Pasta (Clam shaped)",
  "\t2 Onions",
  "",
  "Instructions:",
  "\tBoil pasta until al dente and drain",
  "",
  "[While pasta is boiling]",
  "\tSlice the onions",
  "",
]);

describe("parseRecipeText", () => {
  it("reads the header fields", () => {
    const { recipe } = parseRecipeText(pastaFile);

    expect(recipe).toMatchObject({
      title: "15 Min Pulled Oats & Mushroom Pasta",
      description: "",
      source: "Valdemarsro",
      sourceUrl: "https://example.com/pasta",
      yield: "4 peeps",
      activeTime: "15 mins",
      totalTime: "30 min",
      tags: [],
    });
  });

  it("keeps lines that don't start with a known key as part of the field above", () => {
    // Real cases: FinnishPotatoSalad (bare LF inside the CRLF file) and Berrybutter.
    const { recipe } = parseRecipeText(
      [
        "Title: Berry butter\r",
        "Description: Lighten the mayo with sour cream.\n",
        "Durability in freezer: 3 months\r",
        "Mix all together.\r",
        "Source: \r",
        "Ingredients:\r",
        "",
      ].join("\n"),
    );

    expect(recipe.description).toBe(
      "Lighten the mayo with sour cream.\nDurability in freezer: 3 months\nMix all together.",
    );
    expect(recipe.source).toBe("");
  });

  it("adds Notes, up to the end of the file, to the description after a blank line", () => {
    // Shaped like BlueberryOatmealMuffins: the notes contain their own "Key:" lines.
    const { recipe } = parseRecipeText(
      pepperplate([
        "Title: Muffins",
        "Description: Soft and fluffy.",
        "Ingredients:",
        "\t1 egg",
        "",
        "Instructions:",
        "\tBake.",
        "",
        "Notes: Make Ahead: freeze for up to 3 months.",
        "Milk: any milk works.",
        "Nutrition: 205 calories each.",
        "",
      ]),
    );

    expect(recipe.description).toBe(
      "Soft and fluffy.\n\nMake Ahead: freeze for up to 3 months.\nMilk: any milk works.\nNutrition: 205 calories each.",
    );
    expect(recipe.instructions).toEqual([{ text: "Bake." }]);
  });

  it("uses Notes as the description when there is no description", () => {
    const { recipe } = parseRecipeText(
      pepperplate([
        "Title: Salad",
        "Description: ",
        "Ingredients:",
        "Instructions:",
        "Notes: Tip: use yoghurt.",
      ]),
    );

    expect(recipe.description).toBe("Tip: use yoghurt.");
  });

  it("keeps block keywords inside Notes as note text", () => {
    const { recipe } = parseRecipeText(
      pepperplate([
        "Title: Bread",
        "Ingredients:",
        "\t1 egg",
        "Instructions:",
        "\tBake.",
        "Notes: Variation",
        "Ingredients:",
        "\tadd seeds",
      ]),
    );

    expect(recipe.description).toBe("Variation\nIngredients:\n\tadd seeds");
    expect(recipe.ingredients).toEqual([{ raw: "1 egg" }]);
  });

  it("has no warnings for a complete recipe", () => {
    expect(parseRecipeText(pastaFile).warnings).toEqual([]);
  });

  it("warns when the title, ingredients or instructions are missing", () => {
    const { warnings } = parseRecipeText(pepperplate(["Title: ", "Ingredients:", "Instructions:"]));

    expect(warnings).toEqual(["No title", "No ingredients", "No instructions"]);
  });

  it("turns Categories into lowercase, trimmed tags", () => {
    const { recipe } = parseRecipeText(
      pepperplate(["Title: Wrap", "Categories: Avocado, tortilla , No Meat,", "Ingredients:"]),
    );

    expect(recipe.tags).toEqual(["avocado", "tortilla", "no meat"]);
  });

  it("reads ingredients and steps, keeping section headers and skipping blank lines", () => {
    const { recipe } = parseRecipeText(
      pepperplate([
        "Title: Soup",
        "Ingredients:",
        "\t2 Onions",
        "",
        "[For the sauce]",
        "\t1 dl cream",
        "",
        "Instructions:",
        "\tBoil pasta until al dente and drain",
        "",
        "[While pasta is boiling]",
        "\tSlice the onions",
        "",
      ]),
    );

    expect(recipe.ingredients).toEqual([
      { raw: "2 Onions" },
      { header: "For the sauce" },
      { raw: "1 dl cream" },
    ]);
    expect(recipe.instructions).toEqual([
      { text: "Boil pasta until al dente and drain" },
      { header: "While pasta is boiling" },
      { text: "Slice the onions" },
    ]);
  });
});
