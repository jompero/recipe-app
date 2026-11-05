import { act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { PlanDays } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";

// Fake the data seam: a signed-in member, a fixed recipe list, and Plan days the tests can change.
const fake = vi.hoisted(() => ({
  recipes: [] as StoredRecipe[],
  /** The ranges watched, in order, as "first/last". */
  watched: [] as string[],
  listeners: new Map<string, (days: PlanDays) => void>(),
  errorListeners: new Map<string, (error: Error) => void>(),
  /** Delivers days to whoever watches the range. */
  push(range: string, days: PlanDays) {
    fake.listeners.get(range)?.(days);
  },
}));
vi.mock("../data/menu.ts", () => ({
  watchDays: (
    first: string,
    last: string,
    onChange: (days: PlanDays) => void,
    onError: (error: Error) => void,
  ) => {
    const range = `${first}/${last}`;
    fake.watched.push(range);
    fake.listeners.set(range, onChange);
    fake.errorListeners.set(range, onError);
    return () => {
      fake.listeners.delete(range);
      fake.errorListeners.delete(range);
    };
  },
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

const THIS_WEEK = "2026-11-02/2026-11-08";

beforeEach(() => {
  // Thursday 5 Nov 2026, early evening. Only Date is faked, so user events still run.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 5, 18, 0));
  fake.watched = [];
  fake.listeners.clear();
  fake.errorListeners.clear();
  fake.recipes = [
    storedRecipe("Spinach Pie", { thumbnail: "data:image/jpeg;base64,PIE" }),
    storedRecipe("Chicken Soup"),
    storedRecipe("Old Stew", { archived: true }),
  ];
});

afterEach(() => {
  vi.useRealTimers();
});

const day = (label: string) => screen.getByRole("region", { name: label });
const dayLabels = () =>
  screen.getAllByRole("region").map((region) => region.getAttribute("aria-label"));

test("shows this week, Monday to Sunday, with today marked and past days dimmed", () => {
  renderApp("/plan");
  act(() => fake.push(THIS_WEEK, {}));

  expect(fake.watched).toEqual([THIS_WEEK]);
  expect(screen.getByText("2–8 Nov 2026")).toBeInTheDocument();
  expect(dayLabels()).toEqual([
    "Mon 2 Nov",
    "Tue 3 Nov",
    "Wed 4 Nov",
    "Thu 5 Nov",
    "Fri 6 Nov",
    "Sat 7 Nov",
    "Sun 8 Nov",
  ]);
  expect(day("Thu 5 Nov")).toHaveAttribute("aria-current", "date");
  expect(within(day("Thu 5 Nov")).getByText("Today")).toBeInTheDocument();
  expect(day("Wed 4 Nov")).toHaveAttribute("data-past");
  expect(day("Thu 5 Nov")).not.toHaveAttribute("data-past");
  expect(day("Fri 6 Nov")).not.toHaveAttribute("data-past");
  expect(screen.queryByRole("button", { name: "Today" })).not.toBeInTheDocument();
});

test("shows recipes with their photos, notes, archived and missing recipes, and empty days", () => {
  renderApp("/plan");
  act(() =>
    fake.push(THIS_WEEK, {
      "2026-11-03": [{ id: "a", recipeId: "old-stew" }],
      "2026-11-05": [
        { id: "b", recipeId: "spinach-pie" },
        { id: "c", note: "Salad on the side" },
      ],
      "2026-11-06": [{ id: "d", recipeId: "gone" }],
      "2026-11-07": [],
    }),
  );

  const thursday = within(day("Thu 5 Nov"));
  const pie = thursday.getByRole("link", { name: "Spinach Pie" });
  expect(pie).toHaveAttribute("href", "/recipe/spinach-pie");
  expect(pie.querySelector("img")).toHaveAttribute("src", "data:image/jpeg;base64,PIE");
  expect(thursday.getByText("Salad on the side")).toBeInTheDocument();
  expect(within(day("Tue 3 Nov")).getByRole("link", { name: /Old Stew/ })).toHaveTextContent(
    "Archived",
  );
  expect(within(day("Fri 6 Nov")).getByText("Missing recipe")).toBeInTheDocument();
  expect(within(day("Sat 7 Nov")).getByText("Nothing planned")).toBeInTheDocument();
  expect(within(day("Mon 2 Nov")).getByText("Nothing planned")).toBeInTheDocument();
});

test("opening a planned recipe goes to its page", async () => {
  const { router } = renderApp("/plan");
  act(() => fake.push(THIS_WEEK, { "2026-11-05": [{ id: "b", recipeId: "chicken-soup" }] }));

  await userEvent.click(screen.getByRole("link", { name: "Chicken Soup" }));

  expect(router.state.location.pathname).toBe("/recipe/chicken-soup");
});

test("changes made elsewhere show up live", () => {
  renderApp("/plan");
  act(() => fake.push(THIS_WEEK, {}));
  expect(within(day("Fri 6 Nov")).getByText("Nothing planned")).toBeInTheDocument();

  act(() => fake.push(THIS_WEEK, { "2026-11-06": [{ id: "x", note: "Pizza night" }] }));

  expect(within(day("Fri 6 Nov")).getByText("Pizza night")).toBeInTheDocument();
});

test("the week comes from the URL, and any day in it shows its Monday's week", () => {
  renderApp("/plan?week=2026-12-30");

  expect(fake.watched).toEqual(["2026-12-28/2027-01-03"]);
  expect(screen.getByText("28 Dec 2026 – 3 Jan 2027")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
});

test("a week value that isn't a date shows this week", () => {
  renderApp("/plan?week=soon");

  expect(fake.watched).toEqual([THIS_WEEK]);
});

test("the arrows and Today change the week in the URL without adding history", async () => {
  const { router } = renderApp("/plan");

  await userEvent.click(screen.getByRole("button", { name: "Next week" }));
  expect(router.state.location.search).toBe("?week=2026-11-09");
  expect(screen.getByText("9–15 Nov 2026")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Previous week" }));
  await userEvent.click(screen.getByRole("button", { name: "Previous week" }));
  expect(router.state.location.search).toBe("?week=2026-10-26");
  for (const region of screen.getAllByRole("region")) {
    expect(region).toHaveAttribute("data-past"); // a week in the past is dimmed throughout
  }

  await userEvent.click(screen.getByRole("button", { name: "Today" }));
  expect(router.state.location.search).toBe("");
  expect(router.state.historyAction).toBe("REPLACE");
});

test("a new week shows as loading, not with the previous week's meals", async () => {
  renderApp("/plan");
  act(() => fake.push(THIS_WEEK, { "2026-11-05": [{ id: "c", note: "Tacos" }] }));

  await userEvent.click(screen.getByRole("button", { name: "Next week" }));

  expect(screen.queryByText("Tacos")).not.toBeInTheDocument();
  expect(screen.getAllByLabelText("Loading")).toHaveLength(7);
  expect(fake.listeners.has(THIS_WEEK)).toBe(false); // the old week isn't watched any more
});

test("a failure to load the week shows the error", () => {
  renderApp("/plan");

  act(() =>
    fake.errorListeners.get(THIS_WEEK)?.(new Error("Missing or insufficient permissions.")),
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Missing or insufficient permissions.");
});

test("the menu lists the Plan and names the page", async () => {
  const { router } = renderApp("/?sort=az");

  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  await userEvent.click(screen.getByRole("button", { name: "Plan" }));
  expect(router.state.location.pathname).toBe("/plan");

  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  expect(screen.getByRole("heading", { name: "Plan", level: 2 })).toBeInTheDocument();
});
