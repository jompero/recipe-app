import { buildImportPreview, recipeIdFromFileName } from "./pepperplateImport.ts";

function pepperplate(title: string, ingredients: string[], steps: string[]): string {
  return [
    `Title: ${title}`,
    "Ingredients:",
    ...ingredients.map((line) => `\t${line}`),
    "",
    "Instructions:",
    ...steps.map((line) => `\t${line}`),
    "",
  ].join("\r\n");
}

describe("buildImportPreview", () => {
  const pasta = {
    name: "PastaBake.txt",
    text: pepperplate("Pasta Bake", ["400 g pasta", "Salt"], ["Bake."]),
  };
  const soup = { name: "Soup.txt", text: pepperplate("Soup", ["1 l water"], []) };

  it("gives each recipe its ID, parsed content and matching photo", () => {
    const preview = buildImportPreview([pasta, soup], ["PastaBake.jpg", "manifest.json"]);

    expect(preview.recipes).toEqual([
      expect.objectContaining({
        id: "pasta-bake",
        fileName: "PastaBake.txt",
        photoFileName: "PastaBake.jpg",
        warnings: [],
      }),
      expect.objectContaining({
        id: "soup",
        fileName: "Soup.txt",
        photoFileName: null,
        warnings: ["No photo", "No instructions"],
      }),
    ]);
    expect(preview.recipes[0]?.recipe.title).toBe("Pasta Bake");
    expect(preview.recipes[0]?.recipe.ingredients[0]).toMatchObject({ qty: 400, unit: "g" });
  });

  it("counts recipes, photos and ingredient lines with no amount", () => {
    const preview = buildImportPreview([pasta, soup], ["PastaBake.jpg"]);

    expect(preview.totals).toEqual({
      recipes: 2,
      withPhoto: 1,
      ingredientLines: 3,
      linesWithoutAmount: 1,
    });
    expect(preview.recipes[0]?.linesWithoutAmount).toBe(1);
  });

  it("ignores files that aren't Pepperplate recipes", () => {
    const preview = buildImportPreview([pasta, { name: "README.md", text: "# hi" }], []);

    expect(preview.recipes.map((recipe) => recipe.fileName)).toEqual(["PastaBake.txt"]);
  });

  it("matches photos regardless of extension case", () => {
    const preview = buildImportPreview([pasta], ["PastaBake.JPG"]);

    expect(preview.recipes[0]?.photoFileName).toBe("PastaBake.JPG");
  });
});

describe("recipeIdFromFileName", () => {
  it.each([
    ["BlueberryOatmealMuffins.txt", "blueberry-oatmeal-muffins"],
    ["15MinPulledOatsMushroomPasta.txt", "15-min-pulled-oats-mushroom-pasta"],
    ["5IngredientSpinachMuffins.txt", "5-ingredient-spinach-muffins"],
    ["CauliflowerSoupwithACrunch.txt", "cauliflower-soupwith-a-crunch"],
    ["PBJOatCups.txt", "pbj-oat-cups"],
    ["EASYVEGGIEQUESADILLAS.txt", "easyveggiequesadillas"],
    ["Eddiebuns24butts.txt", "eddiebuns-24-butts"],
    ["ChocolateCake_2.txt", "chocolate-cake-2"],
  ])("%s → %s", (fileName, id) => {
    expect(recipeIdFromFileName(fileName)).toBe(id);
  });
});
