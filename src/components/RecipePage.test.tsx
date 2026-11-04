import { act, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";

// Fake the data seam: a member, the live recipe list, and full images the test releases.
const fake = vi.hoisted(() => ({
  recipes: [] as StoredRecipe[],
  fullImage: null as { resolve: (url: string | null) => void } | null,
  setArchived: vi.fn<(id: string, archived: boolean) => Promise<void>>(() => Promise.resolve()),
}));
vi.mock("../data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: StoredRecipe[]) => void) => {
    onChange(fake.recipes);
    return () => {};
  },
  setArchived: fake.setArchived,
  existingRecipeIds: vi.fn(),
  saveRecipes: vi.fn(),
}));
vi.mock("../data/images.ts", () => ({
  loadFullImage: vi.fn(
    () =>
      new Promise<string | null>((resolve) => {
        fake.fullImage = { resolve };
      }),
  ),
}));
vi.mock("../data/backup.ts", () => ({ exportEverything: vi.fn(), restoreEverything: vi.fn() }));
vi.mock("../data/auth.ts", () => ({
  watchSession: (onChange: (session: Session) => void) => {
    onChange({ status: "member", user: { name: "Ada", email: "ada@example.com", photoUrl: null } });
    return () => {};
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const soup = storedRecipe("Chicken Soup", {
  description: "A warming soup for winter.",
  source: "Valdemarsro",
  sourceUrl: "https://example.com/soup",
  yield: "4 servings",
  activeTime: "20 min",
  totalTime: "1 hour",
  tags: ["chicken", "soup"],
  thumbnail: "data:image/jpeg;base64,THUMB",
  hasImage: true,
  ingredients: [
    { raw: "1 kg chicken thighs", qty: 1, unit: "kg", item: "chicken thighs" },
    { header: "For the broth" },
    { raw: "1 1/2 l water", qty: 1.5, unit: "l", item: "water" },
    { raw: "Salt & pepper", item: "Salt & pepper" },
  ],
  instructions: [
    { text: "Brown the chicken." },
    { header: "Broth" },
    { text: "Add the water." },
    { text: "Simmer for an hour." },
  ],
});

beforeEach(() => {
  fake.recipes = [soup];
  fake.fullImage = null;
  fake.setArchived.mockClear();
  sessionStorage.clear();
});

const items = (name: string) =>
  within(screen.getByRole("list", { name }))
    .getAllByRole("listitem")
    .map((li) => li.textContent);

test("shows the whole recipe on one page", () => {
  renderApp("/recipe/chicken-soup");
  expect(screen.getByRole("heading", { level: 1, name: "Chicken Soup" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Valdemarsro" })).toHaveAttribute(
    "href",
    "https://example.com/soup",
  );
  for (const text of [
    "4 servings",
    "20 min",
    "1 hour",
    "chicken · soup",
    "A warming soup for winter.",
  ]) {
    expect(screen.getByText(text)).toBeInTheDocument();
  }
  expect(items("Ingredients")).toEqual([
    "1 kg chicken thighs",
    "For the broth",
    "1 1/2 l water",
    "Salt & pepper",
  ]);
  // Steps are numbered across section headers.
  expect(items("Method")).toEqual([
    "1Brown the chicken.",
    "Broth",
    "2Add the water.",
    "3Simmer for an hour.",
  ]);
});

const photo = () => screen.getByRole("presentation").getAttribute("src");

test("shows the thumbnail at once, then the full photo when it has loaded", async () => {
  renderApp("/recipe/chicken-soup");
  expect(photo()).toBe("data:image/jpeg;base64,THUMB");

  act(() => fake.fullImage?.resolve("data:image/jpeg;base64,FULL"));
  await waitFor(() => expect(photo()).toBe("data:image/jpeg;base64,FULL"));
});

test("a recipe without a photo shows no photo and loads none", () => {
  fake.recipes = [storedRecipe("Plain Toast")];
  renderApp("/recipe/plain-toast");
  expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  expect(fake.fullImage).toBeNull();
});

const line = (text: string) => screen.getByRole("button", { name: text });

test("tapping an ingredient or a step ticks it off, and tapping again unticks it", async () => {
  renderApp("/recipe/chicken-soup");
  await userEvent.click(line("1 kg chicken thighs"));
  await userEvent.click(line("Add the water."));
  expect(line("1 kg chicken thighs")).toHaveAttribute("aria-pressed", "true");
  expect(line("Add the water.")).toHaveAttribute("aria-pressed", "true");
  expect(line("Brown the chicken.")).toHaveAttribute("aria-pressed", "false");

  await userEvent.click(line("1 kg chicken thighs"));
  expect(line("1 kg chicken thighs")).toHaveAttribute("aria-pressed", "false");
});

test("ticks survive a reload of the page", async () => {
  const first = renderApp("/recipe/chicken-soup");
  await userEvent.click(line("Simmer for an hour."));
  first.unmount();

  renderApp("/recipe/chicken-soup");
  expect(line("Simmer for an hour.")).toHaveAttribute("aria-pressed", "true");
});

test("leaving the recipe and opening it again starts with no ticks", async () => {
  const { router } = renderApp("/recipe/chicken-soup");
  await userEvent.click(line("Simmer for an hour."));

  await act(() => router.navigate("/"));
  await act(() => router.navigate("/recipe/chicken-soup"));
  expect(line("Simmer for an hour.")).toHaveAttribute("aria-pressed", "false");
});

test("the scale buttons rewrite only the amounts; lines without one stay as written", async () => {
  renderApp("/recipe/chicken-soup");
  const scale = within(screen.getByRole("radiogroup", { name: "Scale" }));
  expect(scale.getByRole("radio", { name: "1×" })).toHaveAttribute("aria-checked", "true");

  await userEvent.click(scale.getByRole("radio", { name: "2×" }));
  expect(items("Ingredients")).toEqual([
    "2 kg chicken thighs",
    "For the broth",
    "3 l water",
    "Salt & pepper",
  ]);

  await userEvent.click(scale.getByRole("radio", { name: "½" }));
  expect(items("Ingredients")).toEqual([
    "0.5 kg chicken thighs",
    "For the broth",
    "0.75 l water",
    "Salt & pepper",
  ]);
});

test("an unknown recipe says so and links back to the cookbook", () => {
  renderApp("/recipe/no-such-recipe");
  expect(screen.getByRole("heading", { name: "Recipe not found" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to the cookbook" })).toHaveAttribute("href", "/");
});

test("keeps the screen awake while the recipe is open", async () => {
  const request = vi.fn(() => Promise.resolve({ release: () => Promise.resolve() }));
  Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
  try {
    renderApp("/recipe/chicken-soup");
    await waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
  } finally {
    Reflect.deleteProperty(navigator, "wakeLock");
  }
});

async function chooseFromMenu(action: string) {
  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  const menu = await screen.findByRole("dialog", { name: "Menu" });
  await userEvent.click(within(menu).getByRole("button", { name: action }));
}

describe("archive", () => {
  test("Archive asks first; confirming archives the recipe and returns to the cookbook", async () => {
    const { router } = renderApp("/recipe/chicken-soup");
    await chooseFromMenu("Archive");

    const confirm = await screen.findByRole("dialog", { name: "Archive this recipe?" });
    expect(fake.setArchived).not.toHaveBeenCalled();
    await userEvent.click(within(confirm).getByRole("button", { name: "Archive" }));

    expect(fake.setArchived).toHaveBeenCalledWith("chicken-soup", true);
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  test("Cancel leaves the recipe alone", async () => {
    const { router } = renderApp("/recipe/chicken-soup");
    await chooseFromMenu("Archive");
    const confirm = await screen.findByRole("dialog", { name: "Archive this recipe?" });
    await userEvent.click(within(confirm).getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Archive this recipe?" }),
      ).not.toBeInTheDocument(),
    );
    expect(fake.setArchived).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/recipe/chicken-soup");
  });

  test("an archived recipe says so and offers Unarchive, which needs no confirmation", async () => {
    fake.recipes = [{ ...soup, archived: true }];
    renderApp("/recipe/chicken-soup");
    expect(screen.getByText("Archived")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    expect(within(menu).queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    await userEvent.click(within(menu).getByRole("button", { name: "Unarchive" }));

    expect(fake.setArchived).toHaveBeenCalledWith("chicken-soup", false);
  });
});
