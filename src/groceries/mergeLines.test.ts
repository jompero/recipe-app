import { mergeLines } from "./mergeLines.ts";
import baseDataLines from "./fixtures/baseDataLines.json";
import type { SourceLine } from "./types.ts";

let nextId = 0;
/** Source lines from raw text, each from its own recipe unless said otherwise. */
function lines(...raws: string[]): SourceLine[] {
  return raws.map((raw) => ({ id: `l${nextId++}`, raw, scale: 1 }));
}

/** The merged list as "name: amount" rows, the way a member reads it. */
function rows(sources: SourceLine[]): string[] {
  return mergeLines(sources).map((line) => `${line.name}: ${line.amount}`);
}

describe("mergeLines", () => {
  test("lines for the same thing in the same unit add up, sorted A–Z", () => {
    expect(rows(lines("400 g pasta", "50 g butter", "100 g Pasta (penne)"))).toEqual([
      "butter: 50 g",
      "pasta: 500 g",
    ]);
  });

  test.each([
    [["1 lb minced beef", "200 g minced beef"], "654 g"],
    [["4 oz cheddar"], "113 g"],
    [["500 g flour", "1 kg flour"], "1.5 kg"],
    [["1.25 kg potatoes"], "1.25 kg"],
    [["600 g rice", "400 g rice"], "1 kg"],
    [["2.5 g saffron"], "2.5 g"],
  ])("mass converts to g or kg: %j", (raws, amount) => {
    expect(mergeLines(lines(...raws))[0]?.amount).toBe(amount);
  });

  test.each([
    [["1 cup milk", "250 ml milk"], "4.9 dl"],
    [["1 dl cream", "1 dl cream"], "2 dl"],
    [["1 l stock", "5 dl stock"], "1.5 l"],
    [["3 tbsp water", "4 tbsp water"], "1.1 dl"],
    [["2 tbsp olive oil"], "2 tbsp"],
    [["1 tbsp soy sauce", "1 tsp soy sauce"], "1 tbsp + 1 tsp"],
    [["1 tsp cumin", "2 tsp cumin"], "1 tbsp"],
    [["½ tsp salt"], "½ tsp"],
    [["1½ tsp paprika"], "1½ tsp"],
  ])("volume converts to tbsp/tsp, dl or l: %j", (raws, amount) => {
    expect(mergeLines(lines(...raws))[0]?.amount).toBe(amount);
  });

  test.each([
    [["2 cloves garlic", "3 cloves garlic"], "5 cloves"],
    [["1 clove garlic"], "1 clove"],
    [["1 pinch salt", "2 pinches salt"], "3 pinches"],
    [["2 bunches dill"], "2 bunches"],
    [["2 eggs", "3 eggs"], "5"],
    [["½ onion", "1 onion"], "1½"],
  ])("counted amounts add up with the same unit: %j", (raws, amount) => {
    expect(mergeLines(lines(...raws))[0]?.amount).toBe(amount);
  });

  test.each([
    [["2 dl milk", "100 g milk"], "2 dl + 100 g"],
    [["1 can tomatoes", "400 g tomatoes", "1 can tomatoes"], "2 cans + 400 g"],
    [["2 eggs", "1 dl egg"], "2 + 1 dl"],
  ])("amounts of different kinds stay apart, in the order first seen: %j", (raws, amount) => {
    expect(rows(lines(...raws))).toHaveLength(1);
    expect(mergeLines(lines(...raws))[0]?.amount).toBe(amount);
  });

  test.each([
    [["1-2 cloves garlic", "3 cloves garlic"], "4–5 cloves"],
    [["2-3 eggs"], "2–3"],
    [["1-2 tbsp oil"], "1–2 tbsp"],
    [["½-1 tsp chili flakes"], "½–1 tsp"],
    [["2 tsp honey", "0-2 tsp honey"], "2 tsp – 1 tbsp + 1 tsp"],
    [["1/2-1 dl sugar"], "0.5–1 dl"],
    [["600-800 g potatoes", "200 g potatoes"], "0.8–1 kg"],
  ])("ranges add up low end to low end, high to high: %j", (raws, amount) => {
    expect(mergeLines(lines(...raws))[0]?.amount).toBe(amount);
  });

  test("lines with no amount merge by name and show no amount", () => {
    expect(rows(lines("Salt", "salt", "olive oil for frying"))).toEqual([
      "olive oil for frying: ",
      "Salt: ",
    ]);
  });

  test("a name with and without amounts shows '+ some'", () => {
    expect(rows(lines("200 g butter", "butter", "1 tbsp butter"))).toEqual([
      "butter: 200 g + 1 tbsp + some",
    ]);
  });

  test("each line's scale is applied before adding up", () => {
    const doubled: SourceLine = { id: "d", raw: "1 dl cream", scale: 2 };
    const halved: SourceLine = { id: "h", raw: "1-2 cloves garlic", scale: 0.5 };
    expect(rows([doubled, ...lines("1 dl cream"), halved])).toEqual([
      "cream: 3 dl",
      "garlic: ½–1 clove",
    ]);
  });

  test("the name shown is the one most lines use", () => {
    expect(rows(lines("1 æg", "2 eggs", "3 eggs, beaten"))).toEqual(["eggs: 6"]);
  });

  test("the name shown has no brackets, comma tail or leading 'of'", () => {
    expect(rows(lines("1 can of tomatoes (chopped), drained", "of salt"))).toEqual([
      "salt: ",
      "tomatoes: 1 can",
    ]);
  });

  test("over the real recipes, every line lands in exactly one merged line", () => {
    const sources: SourceLine[] = baseDataLines.flatMap((recipe, r) =>
      recipe.map((raw, i) => ({ id: `${r}-${i}`, raw, scale: 1, recipeId: `r${r}` })),
    );
    const merged = mergeLines(sources);
    const ids = merged.flatMap((line) => line.sources.map((source) => source.id));
    expect(ids.sort()).toEqual(sources.map((source) => source.id).sort());
    expect(merged.length).toBeLessThan(sources.length);
    for (const line of merged) expect(line.amount).not.toMatch(/NaN|undefined|Infinity/);
  });

  test("sorted A–Z by the name shown, ignoring case", () => {
    expect(rows(lines("1 dl flour", "1 dl Sugar", "Apples"))).toEqual([
      "Apples: ",
      "flour: 1 dl",
      "Sugar: 1 dl",
    ]);
  });

  test("footnote stars are not part of the name", () => {
    expect(rows(lines("1 l chicken stock*", "1 dl chicken stock"))).toEqual([
      "chicken stock: 1.1 l",
    ]);
  });

  test("a merged line keeps every source line behind it", () => {
    const sources = lines("400 g pasta", "100 g pasta");
    expect(mergeLines(sources)[0]?.sources).toEqual(sources);
  });
});
