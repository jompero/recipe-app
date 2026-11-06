import { mergeKey } from "./mergeKey.ts";

describe("mergeKey", () => {
  it.each([
    ["Olive oil", "olive oil"],
    ["  olive   oil ", "olive oil"],
    ["Pasta (Clam shaped)", "pasta"],
    ["(140g) fresh or frozen blueberry (see note)", "fresh or frozen blueberry"],
    ["bacon, sliced", "bacon"],
    ["olive oil, divided", "olive oil"],
    ["of salt", "salt"],
    ["chicken stock*", "chicken stock"],
    ["grated ginger**", "grated ginger"],
  ])("cleans up %j to %j", (item, key) => {
    expect(mergeKey(item)).toBe(key);
  });

  it.each([
    ["eggs", "egg"],
    ["cherry tomatoes", "cherry tomato"],
    ["potatoes", "potato"],
    ["blueberries", "blueberry"],
    ["peaches", "peach"],
    ["radishes", "radish"],
    ["boxes", "box"],
    ["cheeses", "cheese"],
    ["bay leaves", "bay leaf"],
    ["cookies", "cookie"],
  ])("makes the last word singular: %j", (item, key) => {
    expect(mergeKey(item)).toBe(key);
  });

  it.each(["hummus", "couscous", "asparagus", "molasses", "swiss", "grass", "lemon juice"])(
    "leaves %j alone",
    (item) => {
      expect(mergeKey(item)).toBe(item);
    },
  );

  it.each([
    ["garlic cloves", "garlic"],
    ["cloves garlic", "garlic"],
    ["fat garlic", "garlic"],
    ["Æg", "egg"],
    ["sukker", "sugar"],
    ["smør", "butter"],
    ["hvedemel", "wheat flour"],
    ["flour", "wheat flour"],
    ["all-purpose flour", "wheat flour"],
    ["plain flour", "wheat flour"],
    ["all purpose flour", "wheat flour"],
    ["maito", "milk"],
    ["sipuli", "onion"],
    ["fløde", "cream"],
    ["kerma", "cream"],
  ])("maps the synonym %j to %j", (item, key) => {
    expect(mergeKey(item)).toBe(key);
  });

  it.each([
    ["finely chopped onion", "finely chopped onion"],
    ["chopped tomatoes", "chopped tomato"],
    ["large eggs", "large egg"],
  ])("keeps prep and size words: %j", (item, key) => {
    expect(mergeKey(item)).toBe(key);
  });

  it("only changes the last word", () => {
    expect(mergeKey("brussels sprouts")).toBe("brussels sprout");
  });
});
