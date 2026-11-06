import { act, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { GroceryList, NewSourceLine } from "../data/groceries.ts";
import type { PlanDays } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";

// Fake the data seam: a signed-in member, a fixed recipe list, Plan days and a grocery list the
// tests can change.
const fake = vi.hoisted(() => ({
  recipes: [] as StoredRecipe[],
  watched: [] as string[],
  listeners: new Map<string, (days: PlanDays) => void>(),
  listListener: null as ((list: GroceryList) => void) | null,
  replaceList: vi.fn<(lines: NewSourceLine[]) => Promise<unknown>>(),
  addLines: vi.fn<(lines: NewSourceLine[]) => Promise<unknown>>(),
  push(range: string, days: PlanDays) {
    fake.listeners.get(range)?.(days);
  },
  pushList(list: Partial<GroceryList>) {
    fake.listListener?.({ lines: [], ticked: [], updatedAt: null, ...list });
  },
}));
vi.mock("../data/menu.ts", () => ({
  watchDays: (first: string, last: string, onChange: (days: PlanDays) => void) => {
    const range = `${first}/${last}`;
    fake.watched.push(range);
    fake.listeners.set(range, onChange);
    return () => fake.listeners.delete(range);
  },
  addEntry: vi.fn(),
  removeEntry: vi.fn(),
  moveEntry: vi.fn(),
  setEntryScale: vi.fn(),
}));
vi.mock("../data/groceries.ts", () => ({
  watchGroceryList: (onChange: (list: GroceryList) => void) => {
    fake.listListener = onChange;
    return () => {
      fake.listListener = null;
    };
  },
  replaceList: fake.replaceList,
  addLines: fake.addLines,
}));
vi.mock("../data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: StoredRecipe[]) => void) => {
    onChange(fake.recipes);
    return () => {};
  },
  setArchived: vi.fn(),
}));
vi.mock("../data/images.ts", () => ({ loadFullImage: vi.fn(() => Promise.resolve(null)) }));
vi.mock("../data/backup.ts", () => ({ exportEverything: vi.fn(), restoreEverything: vi.fn() }));
vi.mock("../data/auth.ts", () => ({
  watchSession: (onChange: (session: Session) => void) => {
    onChange({ status: "member", user: { name: "Ada", email: "ada@example.com", photoUrl: null } });
    return () => {};
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

/** Friday 6 Nov 2026 to Sunday 8 Nov: the default range for this week. */
const REST_OF_WEEK = "2026-11-06/2026-11-08";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 6, 18, 0));
  fake.watched = [];
  fake.listeners.clear();
  fake.listListener = null;
  fake.replaceList.mockReset().mockResolvedValue([]);
  fake.addLines.mockReset().mockResolvedValue([]);
  fake.recipes = [
    storedRecipe("Pasta", {
      ingredients: [
        { raw: "400 g pasta", qty: 400, unit: "g", item: "pasta" },
        { header: "Sauce" },
        { raw: "1 dl cream", qty: 1, unit: "dl", item: "cream" },
      ],
    }),
    storedRecipe("Soup", { ingredients: [{ raw: "1 onion", qty: 1, item: "onion" }] }),
    storedRecipe("Old Stew", {
      archived: true,
      ingredients: [{ raw: "1 kg beef", qty: 1, unit: "kg", item: "beef" }],
    }),
  ];
});

afterEach(() => {
  vi.useRealTimers();
});

const PLAN: PlanDays = {
  "2026-11-06": [
    { id: "e1", recipeId: "pasta", scale: 2 },
    { id: "n1", note: "Eating out" },
  ],
  "2026-11-07": [
    { id: "e2", recipeId: "soup" },
    { id: "e3", recipeId: "gone" },
  ],
  "2026-11-08": [{ id: "e4", recipeId: "old-stew" }],
};

/** The builder for this week, with the Plan and an empty grocery list loaded. */
function openBuilder(list: Partial<GroceryList> = {}) {
  const app = renderApp("/groceries/new?week=2026-11-02");
  act(() => {
    fake.push(REST_OF_WEEK, PLAN);
    fake.pushList(list);
  });
  return app;
}

test("opens on today to the week's Sunday", () => {
  openBuilder();

  expect(screen.getByLabelText("From")).toHaveValue("2026-11-06");
  expect(screen.getByLabelText("To")).toHaveValue("2026-11-08");
  expect(fake.watched).toEqual([REST_OF_WEEK]);
});

test("lists the planned recipes by day, all ticked; notes aren't shown", () => {
  openBuilder();

  const friday = within(screen.getByRole("group", { name: "Fri 6 Nov" }));
  expect(friday.getByRole("checkbox", { name: /Pasta/ })).toBeChecked();
  expect(friday.getByRole("checkbox", { name: /Pasta/ })).toHaveAccessibleName("Pasta 2×");
  expect(screen.queryByText("Eating out")).not.toBeInTheDocument();

  const saturday = within(screen.getByRole("group", { name: "Sat 7 Nov" }));
  expect(saturday.getByRole("checkbox", { name: "Soup" })).toBeChecked();
  expect(saturday.getByRole("checkbox", { name: "Missing recipe" })).toBeDisabled();
  expect(saturday.getByRole("checkbox", { name: "Missing recipe" })).not.toBeChecked();

  const sunday = within(screen.getByRole("group", { name: "Sun 8 Nov" }));
  expect(sunday.getByRole("checkbox", { name: /Old Stew/ })).toBeChecked();
  expect(sunday.getByText("Archived")).toBeInTheDocument();
});

test("with no list yet, Build writes the ticked recipes' lines and opens the list", async () => {
  const { router } = openBuilder();

  await userEvent.click(screen.getByRole("checkbox", { name: "Soup" }));
  await userEvent.click(screen.getByRole("button", { name: "Build list" }));

  expect(fake.replaceList).toHaveBeenCalledWith([
    { raw: "400 g pasta", scale: 2, recipeId: "pasta", title: "Pasta", entryId: "e1" },
    { raw: "1 dl cream", scale: 2, recipeId: "pasta", title: "Pasta", entryId: "e1" },
    { raw: "1 kg beef", scale: 1, recipeId: "old-stew", title: "Old Stew", entryId: "e4" },
  ]);
  expect(router.state.location.pathname).toBe("/groceries");
});

describe("with a list already there", () => {
  const onList = {
    lines: [{ id: "l1", raw: "1 onion", scale: 1, recipeId: "soup", entryId: "e2" }],
  };

  test("Replace starts a new list", async () => {
    openBuilder(onList);

    await userEvent.click(screen.getByRole("button", { name: "Build list" }));
    const dialog = within(screen.getByRole("dialog", { name: "There's already a list" }));
    await userEvent.click(dialog.getByRole("button", { name: "Replace" }));

    expect(fake.replaceList).toHaveBeenCalledOnce();
    expect(fake.replaceList.mock.calls[0]?.[0].map((line) => line.entryId)).toEqual([
      "e1",
      "e1",
      "e2",
      "e4",
    ]);
    expect(fake.addLines).not.toHaveBeenCalled();
  });

  test("Add to it leaves out meals already on the list, and says so first", async () => {
    const { router } = openBuilder(onList);

    await userEvent.click(screen.getByRole("button", { name: "Build list" }));
    const dialog = within(screen.getByRole("dialog", { name: "There's already a list" }));
    expect(
      dialog.getByText("1 meal is already on it and won't be added again."),
    ).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Add to it" }));

    expect(fake.addLines.mock.calls[0]?.[0].map((line) => line.entryId)).toEqual([
      "e1",
      "e1",
      "e4",
    ]);
    expect(fake.replaceList).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/groceries");
  });

  test("Cancel stays on the builder", async () => {
    const { router } = openBuilder(onList);

    await userEvent.click(screen.getByRole("button", { name: "Build list" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(fake.replaceList).not.toHaveBeenCalled();
    expect(fake.addLines).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/groceries/new");
  });
});

test("a past week opens on its Monday to Sunday", () => {
  renderApp("/groceries/new?week=2026-10-26");
  expect(screen.getByLabelText("From")).toHaveValue("2026-10-26");
  expect(screen.getByLabelText("To")).toHaveValue("2026-11-01");
});

test("the range is at most 28 days: moving one end far moves the other", () => {
  openBuilder();

  fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-12-31" } });

  expect(screen.getByLabelText("From")).toHaveValue("2026-12-04");
});

test("with nothing planned, there's nothing to build", () => {
  renderApp("/groceries/new?week=2026-11-02");
  act(() => {
    fake.push(REST_OF_WEEK, { "2026-11-06": [{ id: "n1", note: "Eating out" }] });
    fake.pushList({});
  });

  expect(screen.getByText("No recipes planned on these days.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Build list" })).toBeDisabled();
});

test("the Plan's menu opens the builder for the week on screen", async () => {
  const { router } = renderApp("/plan?week=2026-11-09");

  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  await userEvent.click(screen.getByRole("button", { name: "Grocery list…" }));

  expect(router.state.location.pathname).toBe("/groceries/new");
  expect(router.state.location.search).toBe("?week=2026-11-09");
});
