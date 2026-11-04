import { parseIngredientLine } from "./ingredientLine.ts";
import { scaleIngredient } from "./scale.ts";

/** Real lines from the Pepperplate export, parsed as the app stores them. */
const scale = (raw: string, factor: number) => scaleIngredient(parseIngredientLine(raw), factor);

describe("scaling an ingredient line", () => {
  test("1× leaves every line exactly as written", () => {
    for (const raw of ["1 1/2 cups oats", "\t• 95g tuna, canned", "Salt & pepper"]) {
      expect(scale(raw, 1)).toBe(raw);
    }
  });

  test("lines without an amount stay unchanged", () => {
    expect(scale("Salt & pepper", 2)).toBe("Salt & pepper");
    expect(scale("2nd batch of dough", 2)).toBe("2nd batch of dough");
  });

  test("fractions and mixed numbers come out as friendly fractions", () => {
    expect(scale("1 1/2 cups shredded white cheddar cheese", 2)).toBe(
      "3 cups shredded white cheddar cheese",
    );
    expect(scale("1 1/2 cups shredded white cheddar cheese", 0.5)).toBe(
      "¾ cups shredded white cheddar cheese",
    );
    expect(scale("3/4 tsp Dried Thyme", 2)).toBe("1½ tsp Dried Thyme");
    expect(scale("3/4 tsp Dried Thyme", 3)).toBe("2¼ tsp Dried Thyme");
    expect(scale("1/2 cup oats", 0.5)).toBe("¼ cup oats");
    expect(scale("⅓ cup raisins (optional)", 2)).toBe("⅔ cup raisins (optional)");
    expect(scale("1/4 diced red onion", 0.5)).toBe("⅛ diced red onion");
    expect(scale("3 eggs", 0.5)).toBe("1½ eggs");
  });

  test("an amount with no friendly fraction falls back to one decimal", () => {
    expect(scale("1/3 cup sugar", 0.5)).toBe("0.2 cup sugar");
  });

  test("ranges scale both ends and keep their wording", () => {
    expect(scale("1 –2 tbsp water, to loosen as required", 2)).toBe(
      "2–4 tbsp water, to loosen as required",
    );
    expect(scale("1,5 to 2 dl milk", 2)).toBe("3 to 4 dl milk");
  });

  test("metric amounts use decimals, with the recipe's own decimal comma", () => {
    expect(scale("1,5 to 2 dl milk", 0.5)).toBe("0,75 to 1 dl milk");
    expect(scale("0,5 dl whipping cream", 3)).toBe("1,5 dl whipping cream");
    expect(scale("400 g Pasta (Clam shaped)", 0.5)).toBe("200 g Pasta (Clam shaped)");
    expect(scale("5 dl chicken broth", 0.5)).toBe("2.5 dl chicken broth");
  });

  test("grams and millilitres round to whole numbers", () => {
    expect(scale("• 95g tuna, canned", 0.5)).toBe("• 48g tuna, canned");
  });

  test("keeps bullets, indentation and glued units", () => {
    expect(scale("\t• 95g tuna, canned", 2)).toBe("\t• 190g tuna, canned");
    expect(scale("• 1/2 cup sushi rice", 3)).toBe("• 1½ cup sushi rice");
  });

  test("a non-metric decimal amount comes out as a fraction", () => {
    expect(scale("0,5 handful of fresh oregano or broad-leaved parsley", 3)).toBe(
      "1½ handful of fresh oregano or broad-leaved parsley",
    );
  });
});
