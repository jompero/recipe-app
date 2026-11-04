import { act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";

// Fake the data seam: a signed-in member, and a live recipe list the tests can change.
const live = vi.hoisted(() => ({
  /** null: nothing delivered yet (still loading). */
  recipes: null as StoredRecipe[] | null,
  listeners: new Set<(recipes: StoredRecipe[]) => void>(),
  /** Set to make the subscription fail. */
  error: null as Error | null,
  push(recipes: StoredRecipe[]) {
    live.recipes = recipes;
    for (const listener of live.listeners) listener(recipes);
  },
}));
vi.mock("../data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: StoredRecipe[]) => void, onError: (error: Error) => void) => {
    if (live.error) {
      onError(live.error);
      return () => {};
    }
    live.listeners.add(onChange);
    if (live.recipes) onChange(live.recipes);
    return () => live.listeners.delete(onChange);
  },
  existingRecipeIds: vi.fn(),
  saveRecipes: vi.fn(),
}));
vi.mock("../data/backup.ts", () => ({ exportEverything: vi.fn(), restoreEverything: vi.fn() }));
vi.mock("../data/auth.ts", () => ({
  watchSession: (onChange: (session: Session) => void) => {
    onChange({
      status: "member",
      user: { name: "Ada", email: "ada@example.com", photoUrl: null },
    });
    return () => {};
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

function recipe(title: string, extra: Partial<StoredRecipe> = {}): StoredRecipe {
  return {
    id: title.toLowerCase().replace(/\W+/g, "-"),
    title,
    description: "",
    source: "",
    sourceUrl: "",
    yield: "",
    activeTime: "",
    totalTime: "",
    tags: [],
    ingredients: [],
    instructions: [],
    thumbnail: null,
    hasImage: false,
    archived: false,
    createdAt: new Date("2026-11-03"),
    updatedAt: new Date("2026-11-03"),
    ...extra,
  };
}

beforeEach(() => {
  live.listeners.clear();
  live.error = null;
  live.recipes = [
    recipe("Spinach Pie", { thumbnail: "data:image/jpeg;base64,PIE", tags: ["baking"] }),
    recipe("Chicken Salad", { tags: ["chicken", "salad"] }),
    recipe("Chicken Soup", { tags: ["chicken", "soup"], totalTime: "1 hour" }),
  ];
});

/** The cookbook at a filtered URL (a deep link, so the start menu stays closed). */
function openCookbook(search = "?sort=az") {
  return renderApp(`/${search}`);
}

const cardTitles = () => screen.getAllByRole("link").map((link) => link.textContent);

test("shows a card per recipe, A–Z, with its photo or a placeholder", () => {
  openCookbook();
  expect(cardTitles()).toEqual(["Chicken Salad", "Chicken Soup", "Spinach Pie"]);
  // Photos are decorative (alt=""): the title next to them names the card.
  const photo = (title: string) =>
    screen.getByRole("link", { name: title }).querySelector("img")?.getAttribute("src");
  expect(photo("Spinach Pie")).toBe("data:image/jpeg;base64,PIE");
  expect(photo("Chicken Salad")).toBeUndefined();
});

test("search filters the cards and is kept in the URL, without adding history entries", async () => {
  const { router } = openCookbook();
  await userEvent.type(screen.getByRole("searchbox", { name: "Search recipes" }), "soup");
  expect(cardTitles()).toEqual(["Chicken Soup"]);
  expect(router.state.location.search).toBe("?q=soup");
  expect(router.state.historyAction).toBe("REPLACE");
});

test("tag chips, most used first, narrow to recipes with every selected tag", async () => {
  const { router } = openCookbook();
  const chips = within(screen.getByRole("group", { name: "Tags" }));
  expect(chips.getAllByRole("checkbox").map((chip) => chip.getAttribute("value"))).toEqual([
    "chicken",
    "baking",
    "salad",
    "soup",
  ]);

  await userEvent.click(chips.getByRole("checkbox", { name: "chicken" }));
  await userEvent.click(chips.getByRole("checkbox", { name: "salad" }));
  expect(cardTitles()).toEqual(["Chicken Salad"]);
  expect(router.state.location.search).toBe("?tags=chicken,salad");

  await userEvent.click(chips.getByRole("checkbox", { name: "salad" }));
  expect(cardTitles()).toEqual(["Chicken Salad", "Chicken Soup"]);
});

test("sorting by newest puts the most recently added first", async () => {
  live.recipes = [
    recipe("Apple Stew", { createdAt: new Date("2026-01-01") }),
    recipe("Zucchini Bread", { createdAt: new Date("2026-11-04") }),
  ];
  const { router } = openCookbook();
  expect(cardTitles()).toEqual(["Apple Stew", "Zucchini Bread"]);

  await userEvent.click(screen.getByRole("radio", { name: "Newest" }));
  expect(cardTitles()).toEqual(["Zucchini Bread", "Apple Stew"]);
  expect(router.state.location.search).toBe("?sort=new");
});

test("the list view is an A–Z index with letter dividers, kept in the URL with the filters", async () => {
  const { router } = openCookbook("?tags=chicken");
  await userEvent.click(screen.getByRole("radio", { name: "List" }));
  expect(router.state.location.search).toBe("?tags=chicken&view=list");

  const list = screen.getByRole("list", { name: "Recipes" });
  expect(
    within(list)
      .getAllByRole("link")
      .map((row) => row.textContent),
  ).toEqual([expect.stringContaining("Chicken Salad"), expect.stringContaining("Chicken Soup")]);
  expect(within(list).getByText("1 hour", { exact: false })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "C" })).toBeInTheDocument();

  await userEvent.click(screen.getByRole("radio", { name: "Grid" }));
  expect(screen.queryByRole("list", { name: "Recipes" })).not.toBeInTheDocument();
  expect(router.state.location.search).toBe("?tags=chicken");
});

test("the list view has no letter dividers when sorted by newest", () => {
  openCookbook("?view=list&sort=new");
  expect(screen.getByRole("list", { name: "Recipes" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "C" })).not.toBeInTheDocument();
});

test("when nothing matches, says so and offers to clear the filters", async () => {
  const { router } = openCookbook("?q=pizza&tags=soup&view=list&sort=new");
  expect(screen.getByText("No recipes match")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.queryByText("No recipes match")).not.toBeInTheDocument();
  // Search and tags go; the chosen view and sort stay.
  expect(router.state.location.search).toBe("?sort=new&view=list");
});

test("shows placeholders until the recipes arrive, then updates live as they change", () => {
  live.recipes = null;
  openCookbook();
  expect(screen.getByLabelText("Loading recipes")).toBeInTheDocument();
  expect(screen.queryByText("No recipes match")).not.toBeInTheDocument();

  act(() => live.push([recipe("Spinach Pie")]));
  expect(screen.queryByLabelText("Loading recipes")).not.toBeInTheDocument();
  expect(cardTitles()).toEqual(["Spinach Pie"]);

  // Someone else adds one, and archives nothing yet.
  act(() => live.push([recipe("Spinach Pie"), recipe("Apple Cake")]));
  expect(cardTitles()).toEqual(["Apple Cake", "Spinach Pie"]);
});

test("a card opens its recipe", () => {
  openCookbook();
  expect(screen.getByRole("link", { name: "Chicken Soup" })).toHaveAttribute(
    "href",
    "/recipe/chicken-soup",
  );
});

test("if the recipes can't be loaded, says so", () => {
  live.error = new Error("Missing or insufficient permissions.");
  openCookbook();
  expect(screen.getByText(/couldn't load the recipes/i)).toBeInTheDocument();
  expect(screen.getByText(/Missing or insufficient permissions/)).toBeInTheDocument();
});
