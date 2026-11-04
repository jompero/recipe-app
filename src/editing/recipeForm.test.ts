import type { RecipeDraft } from "../parsing/types.ts";
import { draftFromForm, EMPTY_FORM, formErrors, formFromRecipe } from "./recipeForm.ts";

const stored: RecipeDraft = {
  title: "Chicken Soup",
  description: "Warming.\n\nGood for winter.",
  source: "Valdemarsro",
  sourceUrl: "https://example.com/soup",
  yield: "4 servings",
  activeTime: "20 min",
  totalTime: "1 hour",
  tags: ["chicken", "soup"],
  ingredients: [
    { raw: "1 kg chicken thighs", qty: 1, unit: "kg", item: "chicken thighs" },
    { header: "For the broth" },
    {
      raw: "1 –2 tbsp water, to loosen",
      qty: 1,
      qtyMax: 2,
      unit: "tbsp",
      item: "water, to loosen",
    },
    { raw: "Salt & pepper", item: "Salt & pepper" },
  ],
  instructions: [{ text: "Brown the chicken." }, { header: "Broth" }, { text: "Simmer." }],
};

describe("recipe ⇄ edit form", () => {
  test("the form shows the lists as Pepperplate-style text", () => {
    const form = formFromRecipe(stored);
    expect(form.ingredients).toBe(
      "1 kg chicken thighs\n\n[For the broth]\n1 –2 tbsp water, to loosen\nSalt & pepper",
    );
    expect(form.instructions).toBe("Brown the chicken.\n\n[Broth]\nSimmer.");
    expect(form.tags).toEqual(["chicken", "soup"]);
  });

  test("saving an untouched form gives back the same recipe (headers, ranges, no amount)", () => {
    expect(draftFromForm(formFromRecipe(stored))).toEqual(stored);
  });

  test("saving recalculates amounts from the edited text", () => {
    const form = { ...formFromRecipe(stored), ingredients: "500 g chicken thighs\n2 l water" };
    expect(draftFromForm(form).ingredients).toEqual([
      { raw: "500 g chicken thighs", qty: 500, unit: "g", item: "chicken thighs" },
      { raw: "2 l water", qty: 2, unit: "l", item: "water" },
    ]);
  });

  test("trims the text fields and keeps line breaks inside the description", () => {
    const form = {
      ...EMPTY_FORM,
      title: "  Toast  ",
      description: "\n Crisp.\n\nHot. \n",
      sourceUrl: " https://example.com ",
    };
    const draft = draftFromForm(form);
    expect(draft.title).toBe("Toast");
    expect(draft.description).toBe("Crisp.\n\nHot.");
    expect(draft.sourceUrl).toBe("https://example.com");
  });

  test("tags are saved lowercase, trimmed, without blanks or duplicates", () => {
    const form = { ...EMPTY_FORM, title: "Toast", tags: [" Breakfast", "breakfast", "", "Quick "] };
    expect(draftFromForm(form).tags).toEqual(["breakfast", "quick"]);
  });

  test("a blank form becomes an empty recipe", () => {
    expect(draftFromForm({ ...EMPTY_FORM, title: "Toast" })).toEqual({
      title: "Toast",
      description: "",
      source: "",
      sourceUrl: "",
      yield: "",
      activeTime: "",
      totalTime: "",
      tags: [],
      ingredients: [],
      instructions: [],
    });
  });
});

describe("form errors", () => {
  test("a title is required", () => {
    expect(formErrors(EMPTY_FORM)).toEqual({ title: "A recipe needs a title" });
    expect(formErrors({ ...EMPTY_FORM, title: "   " })).toEqual({
      title: "A recipe needs a title",
    });
    expect(formErrors({ ...EMPTY_FORM, title: "Toast" })).toEqual({});
  });
});
