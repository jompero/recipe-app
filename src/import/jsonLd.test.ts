import { textToIngredients, textToInstructions } from "../parsing/blockText.ts";
import type { RecipeDraft } from "../parsing/types.ts";
import bbcGoodFood from "./fixtures/bbcgoodfood-easy-pancakes.json";
import foodNetwork from "./fixtures/foodnetwork-mac-and-cheese.json";
import madensVerden from "./fixtures/madensverden-boller-i-karry.json";
import nyt from "./fixtures/nyt-chocolate-chip-cookies.json";
import pinchOfYum from "./fixtures/pinchofyum-chocolate-chip-cookies.json";
import recipeTinEats from "./fixtures/recipetineats-chicken-chasseur.json";
import { payloadToDraft } from "./jsonLd.ts";
import type { RecipePayload } from "./recipePayload.ts";

/** Fixtures are JSON, so `v` is typed as a number; they are real payloads all the same. */
function fixture(json: unknown): RecipePayload {
  return json as RecipePayload;
}

function payload(
  recipe: RecipePayload["recipe"],
  url = "https://www.example.com/r/1",
): RecipePayload {
  return { v: 1, url, recipe };
}

const ingredients = (...lines: string[]) => textToIngredients(lines.join("\n"));
const instructions = (...lines: string[]) => textToInstructions(lines.join("\n"));

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

describe("payloadToDraft on real sites", () => {
  it("RecipeTin Eats (WordPress @graph, HowToSection, no publisher)", () => {
    const { draft, photoUrl } = payloadToDraft(fixture(recipeTinEats));

    expect(draft).toEqual<RecipeDraft>({
      title: "JB's Chicken Chasseur",
      description:
        "Recipe video above. Chicken Chasseur (chasseur is French for “hunter”) is a classic French dish made with pieces of chicken cooked in a rich mushroom and tomato sauce with a gentle touch of brandy, finished with fresh tarragon.",
      source: "recipetineats.com",
      sourceUrl: "https://www.recipetineats.com/chicken-chasseur/",
      yield: "4",
      activeTime: "15 min",
      totalTime: "1 hr",
      tags: [],
      ingredients: ingredients(
        "4 chicken thighs, bone-in, skin on ((~250g/8oz each) (Note 1))",
        "3/4 tsp cooking salt / kosher salt",
        "30g / 2 tbsp unsalted butter",
        "400g / 14oz white mushrooms (, sliced 6mm/0.2”)",
        "1/4 cup brandy ((Note 2))",
        "Creamy mashed potato ((or rice or small pasta))",
      ),
      instructions: instructions(
        "[Chicken]",
        "Season the chicken - Pat the chicken dry thoroughly with paper towels.",
        'Brown the Chicken - Heat vegetable oil in a large (30cm/12") skillet (with lid) over medium-high heat.',
        "[Chasseur Sauce]",
        "Tomato and stock - Stir in the tomato paste, cook for 1 minute. Then add the stock, salt, and pepper.",
      ),
    });
    expect(draft.ingredients[0]).toMatchObject({ qty: 4 });
    expect(draft.instructions[0]).toEqual({ header: "Chicken" });
    expect(photoUrl).toBe(
      "https://www.recipetineats.com/tachyon/2025/10/Chicken-Chasseur-JB_7.jpg",
    );
  });

  it("Madens Verden (Danish, @graph, array yield)", () => {
    const { draft, photoUrl } = payloadToDraft(fixture(madensVerden));

    expect(draft).toEqual<RecipeDraft>({
      title: "Boller i karry",
      description:
        "Klassiske boller i karry med kødboller af kalv og svin og en cremet karrysovs lavet med bouillon fra kødbollerne. Server med kogte ris og gerne ærter.",
      source: "madensverden.dk",
      sourceUrl: "https://madensverden.dk/nem-boller-i-karry-opskrift/",
      yield: "4 personer",
      activeTime: "15 min",
      totalTime: "45 min",
      tags: [],
      ingredients: ingredients(
        "400 g hakket kalv og svin",
        "1 tsk salt",
        "friskkværnet peber",
        "1 æg",
        "1,5 dl mælk (måske lidt mere)",
        "2 spsk. smør",
      ),
      instructions: instructions(
        "Kog 1 l vand op sammen med 2 bouillonterninger.",
        "Fisk de færdigkogte kødboller op af vandet med en hulske, og læg til side. Gem kogevandet sovsen.",
        "Læg kødbollerne i sovsen, og lad dem lige varme igennem.",
      ),
    });
    expect(draft.ingredients[0]).toMatchObject({ qty: 400, unit: "g" });
    expect(photoUrl).toBe(
      "https://madensverden.dk/wp-content/uploads/2017/12/billede-med-boller-i-karry.jpg",
    );
  });

  it("Food Network UK (one HTML string of steps, number yield, no total time)", () => {
    const { draft, photoUrl } = payloadToDraft(fixture(foodNetwork));

    expect(draft).toEqual<RecipeDraft>({
      title: "Baked Macaroni and Cheese",
      description: "",
      source: "foodnetwork.co.uk",
      sourceUrl: "https://foodnetwork.co.uk/recipes/baked-macaroni-and-cheese",
      yield: "6",
      activeTime: "20 min",
      totalTime: "1 hr 5 min",
      tags: [],
      ingredients: ingredients(
        "1/2 pound elbow macaroni",
        "3 tablespoons butter",
        "12 ounces sharp cheddar, shredded",
        "Fresh black pepper",
        "For the Topping",
        "1 cup panko bread crumbs",
      ),
      instructions: instructions(
        "Preheat oven to 170°C.",
        "In a large pot of boiling, salted water cook the pasta to al dente.",
        "Melt the butter in a saute pan and toss the bread crumbs to coat. Top the macaroni with the bread crumbs. Bake for 30 minutes.",
        "Remember to save leftovers for fried Macaroni and Cheese.",
      ),
    });
    expect(photoUrl).toBe(
      "https://d2866mruotsy8w.cloudfront.net/production/media/11601/conversions/foodnetwork-image-40218d86-6e96-4dab-9c13-0edbfd60bfbf-default.webp",
    );
  });

  it("NYT Cooking (ImageObject array, publisher name, total time only)", () => {
    const { draft, photoUrl } = payloadToDraft(fixture(nyt));

    expect(draft).toMatchObject<Partial<RecipeDraft>>({
      title: "Best Chocolate Chip Cookies",
      source: "NYT Cooking",
      sourceUrl: "https://cooking.nytimes.com/recipes/1015819-chocolate-chip-cookies",
      yield: "18 5-inch cookies",
      activeTime: "",
      totalTime: "45 min",
      tags: [],
      instructions: instructions(
        "Sift flours, baking soda, baking powder and salt into a bowl. Set aside.",
        "When ready to bake, preheat oven to 350 degrees. Line a baking sheet with parchment paper or a nonstick baking mat. Set aside.",
      ),
    });
    expect(draft.description).toMatch(/^You may have memorized the foolproof gem/);
    expect(draft.ingredients).toHaveLength(5);
    expect(draft.ingredients[1]).toMatchObject({ raw: "1 ⅔ cups bread flour (8 ½ ounces)" });
    expect(photoUrl).toBe(
      "https://static01.nyt.com/images/2022/02/12/dining/JT-Chocolate-Chip-Cookies/JT-Chocolate-Chip-Cookies-videoSixteenByNineJumbo1600.jpg",
    );
  });

  it("BBC Good Food (ImageObject with url, author array, publisher object)", () => {
    const { draft, photoUrl } = payloadToDraft(fixture(bbcGoodFood));

    expect(draft).toEqual<RecipeDraft>({
      title: "Easy pancakes",
      description:
        "Learn how to make the perfect pancakes every time with our foolproof easy crêpe recipe – elaborate flip optional",
      source: "Good Food",
      sourceUrl: "https://www.bbcgoodfood.com/recipes/easy-pancakes",
      yield: "Makes 12",
      activeTime: "10 min",
      totalTime: "30 min",
      tags: [],
      ingredients: ingredients(
        "100g plain flour",
        "2 large eggs",
        "300ml milk",
        "lemon wedges to serve (optional)",
      ),
      instructions: instructions(
        "Set aside for 30 mins to rest if you have time, or start cooking straight away.",
        "Set a medium frying pan or crêpe pan over a medium heat and carefully wipe it with some oiled kitchen paper.",
      ),
    });
    expect(draft.ingredients[2]).toMatchObject({ qty: 300, unit: "ml" });
    expect(photoUrl).toBe(
      "https://images.immediate.co.uk/production/volatile/sites/30/2020/08/recipe-image-legacy-id-1273477_8-ad36e3b.jpg?resize=440,400",
    );
  });

  it("Pinch of Yum (entities in steps, the descriptive yield)", () => {
    const { draft, photoUrl } = payloadToDraft(fixture(pinchOfYum));

    expect(draft).toMatchObject<Partial<RecipeDraft>>({
      title: "The Best Soft Chocolate Chip Cookies",
      source: "pinchofyum.com",
      yield: "12 cookies",
      activeTime: "10 min",
      totalTime: "20 min",
      tags: [],
      instructions: instructions(
        "Preheat the oven to 350 degrees. Microwave the butter for about 40 seconds to just barely melt it. It shouldn’t be hot – but it should be almost entirely in liquid form.",
        "Add the flour, baking soda, and salt. Mix until crumbles form. Use your hands to press the crumbles together into a dough. It should form one large ball that is easy to handle (right at the stage between “wet” dough and “dry” dough). Add the chocolate chips and incorporate with your hands.",
      ),
    });
    expect(draft.ingredients).toHaveLength(4);
    expect(photoUrl).toBe(
      "https://pinchofyum.com/tachyon/Chocolate-Chip-Cookies-Recipe.jpg?fit=225%2C126",
    );
  });
});

describe("payloadToDraft rules", () => {
  describe("missing or odd fields", () => {
    it("gives empty strings and lists for an empty recipe", () => {
      expect(payloadToDraft(payload({}, ""))).toEqual({ draft: EMPTY_DRAFT, photoUrl: null });
    });

    it("never crashes on unexpected shapes", () => {
      const odd = payload({
        name: { "@value": "x" },
        description: ["a", 1],
        recipeIngredient: 42,
        recipeInstructions: [null, 7, { "@type": "HowToStep" }, [], { foo: "bar" }],
        recipeYield: { value: 4 },
        prepTime: 15,
        cookTime: null,
        totalTime: ["PT1H"],
        image: [null, 3, {}, { url: 5 }],
        author: "someone",
        publisher: [null, { logo: "x" }],
      });

      const { draft, photoUrl } = payloadToDraft(odd);

      expect(draft).toEqual({ ...EMPTY_DRAFT, source: "example.com", sourceUrl: odd.url });
      expect(photoUrl).toBeNull();
    });
  });

  describe("text", () => {
    it("decodes entities and strips tags", () => {
      const { draft } = payloadToDraft(
        payload({
          name: "Fish &amp; <em>chips</em>",
          description: "<p>Crisp &ndash; and hot.</p><p>Serve&nbsp;now.</p>",
          recipeIngredient: ["<strong>2</strong> eggs &amp; milk", "1 &frac12; cups flour"],
        }),
      );

      expect(draft.title).toBe("Fish & chips");
      expect(draft.description).toBe("Crisp – and hot.\nServe now.");
      expect(draft.ingredients).toEqual(ingredients("2 eggs & milk", "1 ½ cups flour"));
      expect(draft.ingredients[0]).toMatchObject({ qty: 2 });
    });

    it("doesn't run script or style text into the result", () => {
      const { draft } = payloadToDraft(
        payload({ name: "Soup<script>alert(1)</script><style>p{}</style>" }),
      );

      expect(draft.title).toBe("Soup");
    });
  });

  describe("instructions", () => {
    it("splits a plain string on line breaks and <br>", () => {
      const { draft } = payloadToDraft(
        payload({ recipeInstructions: "Boil water.\r\n\nAdd pasta.<br>Drain.<br/>Serve." }),
      );

      expect(draft.instructions).toEqual(
        instructions("Boil water.", "Add pasta.", "Drain.", "Serve."),
      );
    });

    it("takes an array of strings, one step each", () => {
      const { draft } = payloadToDraft(
        payload({ recipeInstructions: [" Paloittele broileri. ", "Kuumenna pata.\nLisää kerma."] }),
      );

      expect(draft.instructions).toEqual(
        instructions("Paloittele broileri.", "Kuumenna pata. Lisää kerma."),
      );
    });

    it("turns nested sections into header lines and falls back to a step's name", () => {
      const { draft } = payloadToDraft(
        payload({
          recipeInstructions: [
            {
              "@type": "HowToSection",
              name: "Dough",
              itemListElement: [
                { "@type": "HowToStep", name: "Mix." },
                {
                  "@type": "HowToSection",
                  name: "Resting",
                  itemListElement: [{ "@type": "HowToStep", text: "Rest 1 hr." }],
                },
              ],
            },
            {
              "@type": "HowToSection",
              itemListElement: ["Bake."],
            },
            {
              "@type": "HowToStep",
              itemListElement: [
                { "@type": "HowToDirection", text: "Cool." },
                { "@type": "HowToTip", text: "Or eat warm." },
              ],
            },
          ],
        }),
      );

      expect(draft.instructions).toEqual(
        instructions(
          "[Dough]",
          "Mix.",
          "[Resting]",
          "Rest 1 hr.",
          "Bake.",
          "Cool.",
          "Or eat warm.",
        ),
      );
    });

    it("takes a single HowToStep object", () => {
      const { draft } = payloadToDraft(
        payload({ recipeInstructions: { "@type": "HowToStep", text: "Stir." } }),
      );

      expect(draft.instructions).toEqual(instructions("Stir."));
    });
  });

  describe("ingredients", () => {
    it("falls back to the legacy ingredients key", () => {
      expect(payloadToDraft(payload({ ingredients: ["1 egg"] })).draft.ingredients).toEqual(
        ingredients("1 egg"),
      );
      expect(
        payloadToDraft(payload({ recipeIngredient: [], ingredients: ["1 egg"] })).draft.ingredients,
      ).toEqual(ingredients("1 egg"));
    });

    it("prefers recipeIngredient and skips blank lines", () => {
      const { draft } = payloadToDraft(
        payload({ recipeIngredient: ["1 egg", "  ", ""], ingredients: ["2 eggs"] }),
      );

      expect(draft.ingredients).toEqual(ingredients("1 egg"));
    });
  });

  describe("yield", () => {
    it.each([
      [["12", "12 cookies"], "12 cookies"],
      [["4 personer", "4"], "4 personer"],
      ["4, 4 annosta", "4, 4 annosta"],
      [6, "6"],
      [[6], "6"],
      [["", " "], ""],
    ])("picks the most descriptive of %j", (recipeYield, expected) => {
      expect(payloadToDraft(payload({ recipeYield })).draft.yield).toBe(expected);
    });
  });

  describe("times", () => {
    it("adds prep and cook when there is no total", () => {
      const { draft } = payloadToDraft(payload({ prepTime: "PT15M", cookTime: "PT1H" }));

      expect(draft.activeTime).toBe("15 min");
      expect(draft.totalTime).toBe("1 hr 15 min");
    });

    it("uses whichever of prep and cook there is", () => {
      expect(payloadToDraft(payload({ cookTime: "PT30M" })).draft).toMatchObject({
        activeTime: "",
        totalTime: "30 min",
      });
      expect(payloadToDraft(payload({ prepTime: "PT5M" })).draft.totalTime).toBe("5 min");
    });

    it("ignores an unreadable total", () => {
      const { draft } = payloadToDraft(
        payload({ prepTime: "PT10M", cookTime: "PT10M", totalTime: "20 minutes" }),
      );

      expect(draft.totalTime).toBe("20 min");
    });
  });

  describe("source", () => {
    it.each([
      [{ "@type": "Organization", name: "Good &amp; Food" }, "Good & Food"],
      ["Valio", "Valio"],
      [[{ "@type": "Organization", name: "Arla" }], "Arla"],
      [{ "@type": "Organization", url: "https://x.example" }, "example.com"],
    ])("takes the publisher %j as %j", (publisher, expected) => {
      expect(payloadToDraft(payload({ publisher })).draft.source).toBe(expected);
    });

    it("uses the hostname without www., and keeps the page URL", () => {
      const { draft } = payloadToDraft(payload({}, "https://www.valdemarsro.dk/lasagne/"));

      expect(draft.source).toBe("valdemarsro.dk");
      expect(draft.sourceUrl).toBe("https://www.valdemarsro.dk/lasagne/");
    });

    it("gives an empty source for an unreadable URL", () => {
      expect(payloadToDraft(payload({}, "not a url")).draft).toMatchObject({
        source: "",
        sourceUrl: "not a url",
      });
    });

    it("never takes tags from the site", () => {
      const withKeywords = { ...payload({}), recipe: { keywords: "easy, dinner" } };

      expect(payloadToDraft(withKeywords as RecipePayload).draft.tags).toEqual([]);
    });
  });

  describe("photo", () => {
    it.each([
      ["a string", "https://cdn.example.com/a.jpg", "https://cdn.example.com/a.jpg"],
      [
        "an ImageObject with contentUrl",
        { "@type": "ImageObject", contentUrl: "https://cdn.example.com/b.jpg" },
        "https://cdn.example.com/b.jpg",
      ],
      [
        "the first usable entry of an array",
        [
          "",
          { "@type": "ImageObject" },
          "data:image/png;base64,AAAA",
          "https://cdn.example.com/c.jpg",
        ],
        "https://cdn.example.com/c.jpg",
      ],
      [
        "a protocol-relative URL",
        ["//mojo.generalmills.com/api/public/content/x.jpeg?v=1"],
        "https://mojo.generalmills.com/api/public/content/x.jpeg?v=1",
      ],
      ["a relative path", "/img/d.jpg", "https://www.example.com/img/d.jpg"],
      [
        "an ImageObject whose url is an array",
        { "@type": "ImageObject", url: ["https://cdn.example.com/e.jpg"] },
        "https://cdn.example.com/e.jpg",
      ],
    ])("takes %s", (_label, image, expected) => {
      expect(payloadToDraft(payload({ image })).photoUrl).toBe(expected);
    });

    it("gives null when nothing is usable", () => {
      expect(payloadToDraft(payload({ image: ["javascript:alert(1)", ""] })).photoUrl).toBeNull();
    });
  });
});
