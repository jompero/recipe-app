import type { StoredRecipe } from "../data/recipes.ts";
import type { IngredientLine } from "../parsing/types.ts";
import {
  cookbookSearch,
  DEFAULT_STATE,
  letterGroups,
  readCookbookState,
  selectRecipes,
  tagChips,
  type CookbookState,
} from "./cookbook.ts";

function recipe(
  title: string,
  extra: {
    tags?: string[];
    ingredients?: IngredientLine[];
    createdAt?: string;
    archived?: boolean;
  } = {},
): StoredRecipe {
  return {
    id: title.toLowerCase().replace(/\W+/g, "-"),
    title,
    description: "",
    source: "",
    sourceUrl: "",
    yield: "",
    activeTime: "",
    totalTime: "",
    tags: extra.tags ?? [],
    ingredients: extra.ingredients ?? [],
    instructions: [],
    thumbnail: null,
    hasImage: false,
    archived: extra.archived ?? false,
    createdAt: new Date(extra.createdAt ?? "2026-11-03"),
    updatedAt: new Date(extra.createdAt ?? "2026-11-03"),
  };
}

const titles = (recipes: StoredRecipe[]) => recipes.map((r) => r.title);
const state = (patch: Partial<CookbookState>): CookbookState => ({ ...DEFAULT_STATE, ...patch });

describe("search", () => {
  const cookbook = [
    recipe("Spinach Pie"),
    recipe("Crème Brûlée"),
    recipe("Green Smoothie", { ingredients: [{ raw: "2 handfuls baby spinach" }] }),
    recipe("Chicken Salad", { tags: ["chicken", "salad"] }),
    recipe("Plain Toast", { ingredients: [{ header: "Spinach topping" }] }),
  ];

  test("matches part of a word in the title or an ingredient, ignoring case", () => {
    expect(titles(selectRecipes(cookbook, state({ q: "SPIN" })))).toEqual([
      "Green Smoothie",
      "Spinach Pie",
    ]);
  });

  test("ignores accents on both sides", () => {
    expect(titles(selectRecipes(cookbook, state({ q: "creme brulee" })))).toEqual(["Crème Brûlée"]);
    expect(titles(selectRecipes(cookbook, state({ q: "brûl" })))).toEqual(["Crème Brûlée"]);
  });

  test("matches tags", () => {
    expect(titles(selectRecipes(cookbook, state({ q: "sala" })))).toEqual(["Chicken Salad"]);
  });

  test("an empty or blank query matches everything", () => {
    expect(selectRecipes(cookbook, state({ q: "  " }))).toHaveLength(5);
  });
});

describe("tag filter", () => {
  const cookbook = [
    recipe("Chicken Salad", { tags: ["chicken", "salad"] }),
    recipe("Chicken Soup", { tags: ["chicken", "soup"] }),
    recipe("Potato Salad", { tags: ["salad"] }),
  ];

  test("a recipe needs every selected tag", () => {
    expect(titles(selectRecipes(cookbook, state({ tags: ["chicken"] })))).toEqual([
      "Chicken Salad",
      "Chicken Soup",
    ]);
    expect(titles(selectRecipes(cookbook, state({ tags: ["chicken", "salad"] })))).toEqual([
      "Chicken Salad",
    ]);
  });

  test("combines with search", () => {
    expect(titles(selectRecipes(cookbook, state({ q: "potato", tags: ["salad"] })))).toEqual([
      "Potato Salad",
    ]);
  });
});

describe("sort", () => {
  const cookbook = [
    recipe("banana bread", { createdAt: "2026-11-01" }),
    recipe("Apple Pie", { createdAt: "2026-11-03" }),
    recipe("Älplermagronen", { createdAt: "2026-11-02" }),
    recipe("10-minute Pasta", { createdAt: "2026-10-01" }),
    recipe("2-minute Noodles", { createdAt: "2026-10-02" }),
  ];

  test("A–Z by title, ignoring case and accents, numbers in number order", () => {
    expect(titles(selectRecipes(cookbook, state({ sort: "az" })))).toEqual([
      "2-minute Noodles",
      "10-minute Pasta",
      "Älplermagronen",
      "Apple Pie",
      "banana bread",
    ]);
  });

  test("newest first by date added", () => {
    expect(titles(selectRecipes(cookbook, state({ sort: "new" })))).toEqual([
      "Apple Pie",
      "Älplermagronen",
      "banana bread",
      "2-minute Noodles",
      "10-minute Pasta",
    ]);
  });
});

describe("archived", () => {
  const cookbook = [recipe("Kept"), recipe("Retired", { archived: true })];

  test("the cookbook hides archived recipes, even from search", () => {
    expect(titles(selectRecipes(cookbook, state({})))).toEqual(["Kept"]);
    expect(titles(selectRecipes(cookbook, state({ q: "retired" })))).toEqual([]);
  });

  test("the Show archived view shows only archived recipes", () => {
    expect(titles(selectRecipes(cookbook, state({ archived: true })))).toEqual(["Retired"]);
  });
});

describe("tag chips", () => {
  test("all tags in use, most used first, ties A–Z, counting only the current view", () => {
    const cookbook = [
      recipe("A", { tags: ["salad", "chicken"] }),
      recipe("B", { tags: ["soup", "chicken"] }),
      recipe("C", { tags: ["chicken", "baking"] }),
      recipe("D", { tags: ["soup"] }),
      recipe("E", { tags: ["retired-tag", "soup", "soup2"], archived: true }),
    ];
    expect(tagChips(cookbook, false)).toEqual(["chicken", "soup", "baking", "salad"]);
    expect(tagChips(cookbook, true)).toEqual(["retired-tag", "soup", "soup2"]);
  });
});

describe("URL state", () => {
  const read = (search: string) => readCookbookState(new URLSearchParams(search));

  test("no query means the default cookbook, and the default writes no query", () => {
    expect(read("")).toEqual(DEFAULT_STATE);
    expect(cookbookSearch(DEFAULT_STATE)).toBe("");
  });

  test("reads every field", () => {
    expect(read("?q=spin&tags=chicken,salad&sort=new&view=list&archived=1")).toEqual({
      q: "spin",
      tags: ["chicken", "salad"],
      sort: "new",
      view: "list",
      archived: true,
    });
  });

  test("writes only what differs from the default, with readable tag lists", () => {
    expect(cookbookSearch(state({ tags: ["chicken", "salad"], view: "list" }))).toBe(
      "?tags=chicken,salad&view=list",
    );
  });

  test("round trip, including spaces and accents in the search", () => {
    const full = state({ q: "crème brûlée", tags: ["dessert"], sort: "new", archived: true });
    expect(read(cookbookSearch(full))).toEqual(full);
  });

  test("unknown values fall back to the defaults", () => {
    expect(read("?sort=zz&view=table&archived=yes&tags=,,")).toEqual(DEFAULT_STATE);
  });
});

describe("list view letter groups", () => {
  const sorted = [
    recipe("2-minute Noodles"),
    recipe("Älplermagronen"),
    recipe("apple pie"),
    recipe("Banana Bread"),
  ];

  test("with A–Z, one group per first letter (accents folded, numbers under #)", () => {
    const groups = letterGroups(sorted, "az").map((g) => [g.letter, titles(g.recipes)]);
    expect(groups).toEqual([
      ["#", ["2-minute Noodles"]],
      ["A", ["Älplermagronen", "apple pie"]],
      ["B", ["Banana Bread"]],
    ]);
  });

  test("with newest first, one group without a letter, order kept", () => {
    const groups = letterGroups(sorted, "new");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.letter).toBeNull();
    expect(titles(groups[0]?.recipes ?? [])).toEqual(titles(sorted));
  });
});
