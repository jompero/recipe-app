import { parseIngredientLine } from "./ingredientLine.ts";

describe("parseIngredientLine", () => {
  it.each([
    ["400 g Pasta (Clam shaped)", { qty: 400, unit: "g", item: "Pasta (Clam shaped)" }],
    ["2 Onions", { qty: 2, item: "Onions" }],
    ["Salt & pepper", { item: "Salt & pepper" }],
  ])("%s", (raw, expected) => {
    expect(parseIngredientLine(raw)).toEqual({ raw, ...expected });
  });

  it.each([
    ["1/2 onion", 0.5],
    ["1 1/2 tl baking powder", 1.5],
    ["0,5 dl cream", 0.5],
    ["1.5 l water", 1.5],
    ["⅓ cup raisins (optional)", 1 / 3],
    ["1½ dl milk", 1.5],
    ["2 ½ cups flour", 2.5],
  ])("reads the amount in %s", (raw, qty) => {
    expect(parseIngredientLine(raw).qty).toBeCloseTo(qty);
  });

  it.each([
    ["1-2 cloves garlic", 1, 2],
    ["1 –2 tbsp water, to loosen as required", 1, 2],
    ["1 to 2 tsp Sriracha", 1, 2],
    ["4 to 6 small acorn squash or pie pumpkins", 4, 6],
    ["1/2-1 dl sugar", 0.5, 1],
  ])("reads the range in %s", (raw, qty, qtyMax) => {
    expect(parseIngredientLine(raw)).toMatchObject({ qty, qtyMax });
  });

  it.each([
    ["2 tablespoons olive oil", "tbsp"],
    ["1 tablespoon honey", "tbsp"],
    ["3 Tbsp. butter", "tbsp"],
    ["2 tbs soy sauce", "tbsp"],
    ["1 T olive oil", "tbsp"],
    ["2 spsk. olie", "tbsp"],
    ["1 rkl voita", "tbsp"],
    ["1 teaspoon dried thyme", "tsp"],
    ["2 teaspoons cumin", "tsp"],
    ["1/2 tsp. salt", "tsp"],
    ["1 tl kuivattua timjamia", "tsp"],
    ["1 tsk. salt", "tsp"],
    ["1 t cinnamon", "tsp"],
    ["2 cups flour", "cup"],
    ["1/3 c. low-sodium soy sauce, divided", "cup"],
    ["50 g. Yeast", "g"],
    ["100 grams sugar", "g"],
    ["1 kg potatoes", "kg"],
    ["1 dl. finely chopped chives", "dl"],
    ["250 ml milk", "ml"],
    ["1 l water", "l"],
    ["1 liter broth", "l"],
    ["4 oz. cheese", "oz"],
    ["8 ounces cream cheese", "oz"],
    ["1 pound ground beef", "lb"],
    ["2 lbs chicken", "lb"],
    ["2 cloves garlic, finely chopped", "clove"],
    ["3 slices bacon", "slice"],
    ["2 cans chickpeas", "can"],
    ["1 handful spinach", "handful"],
    ["1 pinch salt", "pinch"],
    ["1 bunch parsley", "bunch"],
    ["2 sprigs rosemary", "sprig"],
    ["2 stalks lemongrass, pounded", "stalk"],
  ])("standardises the unit in %s", (raw, unit) => {
    expect(parseIngredientLine(raw).unit).toBe(unit);
  });

  it("keeps the item, prep notes included, after the unit", () => {
    expect(parseIngredientLine("2 cloves garlic, finely chopped")).toEqual({
      raw: "2 cloves garlic, finely chopped",
      qty: 2,
      unit: "clove",
      item: "garlic, finely chopped",
    });
  });

  it.each([
    ["• 1/2 cup sushi rice", { qty: 0.5, unit: "cup", item: "sushi rice" }],
    ["• 95g tuna, canned", { qty: 95, unit: "g", item: "tuna, canned" }],
    ["200g feta", { qty: 200, unit: "g", item: "feta" }],
    ["1 (14.5 oz) can broth", { qty: 1, item: "(14.5 oz) can broth" }],
    ["4 5oz. cans chunk light tuna", { qty: 4, item: "5oz. cans chunk light tuna" }],
    ["1 8-oz (~230g) pkg. spinach", { qty: 1, item: "8-oz (~230g) pkg. spinach" }],
    ["20 , 9 inch rice paper wrappers", { qty: 20, item: "9 inch rice paper wrappers" }],
    ["2 cups", { qty: 2, item: "cups" }],
    ["▢1 teaspoon lemon juice", { qty: 1, unit: "tsp", item: "lemon juice" }],
    ["ca. 1 tsp salt", { qty: 1, unit: "tsp", item: "salt" }],
    ["1 head romaine", { qty: 1, unit: "head", item: "romaine" }],
    ["2 pieces ginger", { qty: 2, unit: "piece", item: "ginger" }],
    ["2 bags spinach", { qty: 2, unit: "bag", item: "spinach" }],
  ])("%s", (raw, expected) => {
    expect(parseIngredientLine(raw)).toEqual({ raw, ...expected });
  });

  it("keeps the item after a range", () => {
    expect(parseIngredientLine("4 to 6 small acorn squash").item).toBe("small acorn squash");
  });
});
