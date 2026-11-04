import { textToIngredients, textToInstructions } from "./blockText.ts";
import { pasteToDraft } from "./pasteText.ts";
import type { RecipeDraft } from "./types.ts";

const EMPTY_DRAFT: RecipeDraft = {
  title: "",
  description: "",
  source: "",
  sourceUrl: "",
  yield: "",
  activeTime: "",
  totalTime: "",
  tags: [],
  ingredients: [],
  instructions: [],
};

/** Every piece of text in a draft, for checking that input lines weren't lost. */
function allText(draft: RecipeDraft): string {
  return [
    draft.title,
    draft.description,
    draft.yield,
    draft.activeTime,
    draft.totalTime,
    ...draft.ingredients.map((line) => ("header" in line ? line.header : line.raw)),
    ...draft.instructions.map((line) => ("header" in line ? line.header : line.text)),
  ].join("\n");
}

const ENGLISH = `Easy Banana Bread

This moist banana bread is the best way to use up overripe bananas.

Prep Time: 15 mins
Cook Time: 1 hr
Total Time: 1 hr 15 mins
Servings: 10 slices

Ingredients
▢ 3 ripe bananas, mashed
▢ 1/3 cup melted butter
▢ 3/4 cup sugar
▢ 1 egg, beaten
▢ 1 teaspoon vanilla
▢ 1 1/2 cups all-purpose flour
▢ pinch of salt

Instructions
1. Preheat the oven to 350°F (175°C).
2. Mix the melted butter into the mashed bananas.
3. Stir in the sugar, egg and vanilla, then the flour and salt.
4. Bake for 1 hour.

Notes
Keeps for 3 days wrapped at room temperature.
`;

describe("pasteToDraft", () => {
  it("splits an English recipe copied from a website", () => {
    expect(pasteToDraft(ENGLISH)).toEqual({
      ...EMPTY_DRAFT,
      title: "Easy Banana Bread",
      description:
        "This moist banana bread is the best way to use up overripe bananas.\n" +
        "Cook Time: 1 hr\n\n" +
        "Keeps for 3 days wrapped at room temperature.",
      yield: "10 slices",
      activeTime: "15 mins",
      totalTime: "1 hr 15 mins",
      ingredients: textToIngredients(
        [
          "3 ripe bananas, mashed",
          "1/3 cup melted butter",
          "3/4 cup sugar",
          "1 egg, beaten",
          "1 teaspoon vanilla",
          "1 1/2 cups all-purpose flour",
          "pinch of salt",
        ].join("\n"),
      ),
      instructions: textToInstructions(
        [
          "Preheat the oven to 350°F (175°C).",
          "Mix the melted butter into the mashed bananas.",
          "Stir in the sugar, egg and vanilla, then the flour and salt.",
          "Bake for 1 hour.",
        ].join("\n"),
      ),
    });
  });

  it("splits a Danish recipe (Valdemarsro-style) with sub-sections", () => {
    const text = `Lasagne med kødsauce

Den klassiske lasagne med masser af kødsauce og cremet bechamelsauce.

Tid: 1 time og 30 min
Antal: 4 personer

Ingredienser

Kødsauce:
500 g hakket oksekød
2 løg
2 fed hvidløg
1 dåse hakkede tomater

Bechamelsauce:
30 g smør
3 spsk mel
5 dl mælk

Sådan gør du
Start med kødsaucen. Brun kødet i en gryde.
Tilsæt løg og hvidløg, og lad det simre i 30 minutter.
Smelt smørret og pisk melet i. Tilsæt mælken lidt ad gangen.
Læg lasagnen i lag og bag den ved 200 grader i 45 minutter.

Tips
Lasagnen kan fryses.`;

    expect(pasteToDraft(text)).toEqual({
      ...EMPTY_DRAFT,
      title: "Lasagne med kødsauce",
      description:
        "Den klassiske lasagne med masser af kødsauce og cremet bechamelsauce.\n\n" +
        "Lasagnen kan fryses.",
      yield: "4 personer",
      totalTime: "1 time og 30 min",
      ingredients: textToIngredients(
        [
          "[Kødsauce]",
          "500 g hakket oksekød",
          "2 løg",
          "2 fed hvidløg",
          "1 dåse hakkede tomater",
          "[Bechamelsauce]",
          "30 g smør",
          "3 spsk mel",
          "5 dl mælk",
        ].join("\n"),
      ),
      instructions: textToInstructions(
        [
          "Start med kødsaucen. Brun kødet i en gryde.",
          "Tilsæt løg og hvidløg, og lad det simre i 30 minutter.",
          "Smelt smørret og pisk melet i. Tilsæt mælken lidt ad gangen.",
          "Læg lasagnen i lag og bag den ved 200 grader i 45 minutter.",
        ].join("\n"),
      ),
    });
  });

  it("splits a Finnish recipe", () => {
    const text = `Lohikeitto

Perinteinen kermainen lohikeitto.

Annokset: 4
Valmisteluaika: 15 min
Kokonaisaika: 40 min

Ainekset:
- 400 g lohta
- 6 perunaa
- 1 sipuli
- 1 l vettä
- 2 dl kermaa
- tilliä

Valmistus:
1) Kuori ja paloittele perunat ja sipuli.
2) Keitä niitä vedessä noin 15 minuuttia.
3) Lisää lohi ja kerma ja keitä vielä 5 minuuttia.
4) Mausta tillillä.

Vinkit:
Tarjoa ruisleivän kanssa.`;

    expect(pasteToDraft(text)).toEqual({
      ...EMPTY_DRAFT,
      title: "Lohikeitto",
      description: "Perinteinen kermainen lohikeitto.\n\nTarjoa ruisleivän kanssa.",
      yield: "4",
      activeTime: "15 min",
      totalTime: "40 min",
      ingredients: textToIngredients(
        ["400 g lohta", "6 perunaa", "1 sipuli", "1 l vettä", "2 dl kermaa", "tilliä"].join("\n"),
      ),
      instructions: textToInstructions(
        [
          "Kuori ja paloittele perunat ja sipuli.",
          "Keitä niitä vedessä noin 15 minuuttia.",
          "Lisää lohi ja kerma ja keitä vielä 5 minuuttia.",
          "Mausta tillillä.",
        ].join("\n"),
      ),
    });
  });

  it("turns short lines ending in a colon into section headers in both lists", () => {
    const text = `Chicken Tacos
Ingredients:
For the chicken:
* 500 g chicken thighs
* 1 tbsp chili powder
For the salsa:
* 4 tomatoes, diced
* 1 red onion
Directions:
Marinate:
1. Toss the chicken with the chili powder.
Cook:
2. Grill the chicken for 6 minutes per side.`;

    const draft = pasteToDraft(text);
    expect(draft.ingredients).toEqual(
      textToIngredients(
        [
          "[For the chicken]",
          "500 g chicken thighs",
          "1 tbsp chili powder",
          "[For the salsa]",
          "4 tomatoes, diced",
          "1 red onion",
        ].join("\n"),
      ),
    );
    expect(draft.instructions).toEqual(
      textToInstructions(
        [
          "[Marinate]",
          "Toss the chicken with the chili powder.",
          "[Cook]",
          "Grill the chicken for 6 minutes per side.",
        ].join("\n"),
      ),
    );
  });

  it("keeps long lines ending in a colon as ordinary lines", () => {
    const line = "Whisk the eggs and sugar until pale and fluffy, then add:";
    const draft = pasteToDraft(`Cake\nMethod\n${line}\nthe flour`);
    expect(draft.instructions).toEqual([{ text: line }, { text: "the flour" }]);
  });

  it("matches headings ignoring case, a trailing colon and spaces", () => {
    const draft = pasteToDraft(
      "Toast\nINGREDIENTS :\n2 slices bread\n  method  \nToast the bread.",
    );
    expect(draft.ingredients).toEqual(textToIngredients("2 slices bread"));
    expect(draft.instructions).toEqual([{ text: "Toast the bread." }]);
    expect(draft.description).toBe("");
  });

  it("sorts lines by their amount when there are no headings", () => {
    const text = `Quick pancakes
2 eggs
3 dl milk
- 1 1/2 dl flour
1. Whisk everything together.
Fry thin pancakes in butter.
Serves 2`;

    expect(pasteToDraft(text)).toEqual({
      ...EMPTY_DRAFT,
      title: "Quick pancakes",
      yield: "2",
      ingredients: textToIngredients("2 eggs\n3 dl milk\n1 1/2 dl flour"),
      instructions: textToInstructions("Whisk everything together.\nFry thin pancakes in butter."),
    });
  });

  it("reads Windows line endings like Unix ones", () => {
    expect(pasteToDraft(ENGLISH.replace(/\n/g, "\r\n"))).toEqual(pasteToDraft(ENGLISH));
  });

  it("reads yield and time on one line split by bars", () => {
    const draft = pasteToDraft("Soup\nPrep: 10 min | Total: 30 min | Serves 4\nMethod\nCook it.");
    expect(draft).toMatchObject({ yield: "4", activeTime: "10 min", totalTime: "30 min" });
    expect(draft.description).toBe("");
  });

  it("reads a yield written number-first, such as '4 personer'", () => {
    expect(pasteToDraft("Suppe\nTil 4 personer\nIngredienser\n1 løg").yield).toBe("Til 4 personer");
  });

  it("drops nothing: every line but headings and label lines lands in some field", () => {
    const headings = ["Ingredients", "Method:", "Tips"];
    const labels = ["Serves 4", "Prep: 10 min"];
    const kept = [
      "Weeknight Chili",
      "A smoky chili for busy evenings.",
      "Cook time: 40 min", // not a recognised label
      "Serves 6", // the yield is already filled
      "Nutrition: 320 kcal",
      "Prep: 15 min | Cook: 40 min", // one part isn't a recognised label
      "500 g minced beef",
      "1 onion, chopped",
      "salt and pepper",
      "For the topping", // no colon: stays an ingredient
      "Brown the beef with the onion.",
      "Simmer for 40 minutes.",
      "Serves 8", // inside the method, so it's a step
      "Even better the next day.",
      "Freezes well.",
    ];
    const text = [
      kept[0],
      kept[1],
      labels[0],
      labels[1],
      kept[2],
      kept[3],
      kept[4],
      kept[5],
      headings[0],
      kept[6],
      kept[7],
      kept[8],
      kept[9],
      headings[1],
      kept[10],
      kept[11],
      kept[12],
      headings[2],
      kept[13],
      kept[14],
    ].join("\n");

    const draft = pasteToDraft(text);
    const output = allText(draft);
    for (const line of kept) expect(output).toContain(line);
    expect(draft).toMatchObject({ yield: "4", activeTime: "10 min" });
    for (const heading of headings) expect(output).not.toContain(heading);
  });

  it("keeps a lone step number rather than losing the line", () => {
    const draft = pasteToDraft("Tea\nMethod\n1.\nBoil water.");
    expect(draft.instructions).toEqual([{ text: "1." }, { text: "Boil water." }]);
  });

  it("gives an empty draft for empty or blank input", () => {
    expect(pasteToDraft("")).toEqual(EMPTY_DRAFT);
    expect(pasteToDraft("  \r\n\n\t\n")).toEqual(EMPTY_DRAFT);
  });

  it("gives a title-only draft for a single line", () => {
    expect(pasteToDraft("  Just a title  ")).toEqual({ ...EMPTY_DRAFT, title: "Just a title" });
  });
});
