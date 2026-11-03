import {
  ingredientsToText,
  instructionsToText,
  textToIngredients,
  textToInstructions,
} from "./blockText.ts";

describe("instructions as edit-form text", () => {
  const instructions = [
    { text: "Boil pasta until al dente and drain" },
    { header: "While pasta is boiling" },
    { text: "Slice the onions" },
  ];
  const text = "Boil pasta until al dente and drain\n\n[While pasta is boiling]\nSlice the onions";

  it("writes one line per step, with a blank line before each section header", () => {
    expect(instructionsToText(instructions)).toBe(text);
  });

  it("reads the text back into the same list", () => {
    expect(textToInstructions(text)).toEqual(instructions);
  });
});

describe("ingredients as edit-form text", () => {
  const ingredients = [
    { raw: "400 g Pasta (Clam shaped)" },
    { raw: "2 Onions" },
    { header: "For the sauce" },
    { raw: "1 dl cream" },
  ];
  const text = "400 g Pasta (Clam shaped)\n2 Onions\n\n[For the sauce]\n1 dl cream";

  it("writes one line per ingredient, with a blank line before each section header", () => {
    expect(ingredientsToText(ingredients)).toBe(text);
  });

  it("reads the text back into the same list", () => {
    expect(textToIngredients(text)).toEqual(ingredients);
  });

  it("tidies loosely typed text once, then leaves it unchanged", () => {
    const typed =
      "\r\n  400 g Pasta (Clam shaped)\r\n\r\n\r\n2 Onions\n[ For the sauce ]\n\t1 dl cream\n\n";

    const tidied = ingredientsToText(textToIngredients(typed));

    expect(tidied).toBe(text);
    expect(ingredientsToText(textToIngredients(tidied))).toBe(tidied);
  });

  it("turns empty text into an empty list and back", () => {
    expect(textToIngredients(" \n ")).toEqual([]);
    expect(ingredientsToText([])).toBe("");
  });
});
