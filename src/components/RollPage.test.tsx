import { act, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { PlanDays } from "../data/menu.ts";
import type { StoredRecipe } from "../data/recipes.ts";
import { storedRecipe } from "../test-utils/recipeFixture.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";
import { ROLL_STORAGE_KEY } from "./RollPage.tsx";

// Fake the data seam: a member, a fixed recipe list, Plan days the tests deliver, and saveRoll.
const fake = vi.hoisted(() => ({
  recipes: [] as StoredRecipe[],
  listeners: new Map<string, (days: PlanDays) => void>(),
  saveRoll: vi.fn<(additions: { date: string; recipeId: string }[]) => Promise<unknown>>(),
  random: vi.fn<() => number>(),
}));
vi.mock("../plan/random.ts", () => ({ random: fake.random }));
vi.mock("../data/menu.ts", () => ({
  watchDays: (first: string, last: string, onChange: (days: PlanDays) => void) => {
    fake.listeners.set(`${first}/${last}`, onChange);
    return () => fake.listeners.delete(`${first}/${last}`);
  },
  saveRoll: fake.saveRoll,
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
vi.mock("../data/groceries.ts", () => ({ watchGroceryList: () => () => {} }));
vi.mock("../data/auth.ts", () => ({
  watchSession: (onChange: (session: Session) => void) => {
    onChange({ status: "member", user: { name: "Ada", email: "ada@example.com", photoUrl: null } });
    return () => {};
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

/** The Plan days the roller watches for the week of 2 Nov: the week ±14 days. */
const NEARBY = "2026-10-19/2026-11-22";
const WEEK = [
  "Mon 2 Nov",
  "Tue 3 Nov",
  "Wed 4 Nov",
  "Thu 5 Nov",
  "Fri 6 Nov",
  "Sat 7 Nov",
  "Sun 8 Nov",
];
const TITLES = ["Pasta", "Soup", "Salad", "Tacos", "Curry", "Stew", "Pie", "Omelette", "Risotto"];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 5, 18, 0));
  sessionStorage.clear();
  fake.listeners.clear();
  fake.saveRoll.mockReset().mockResolvedValue([]);
  fake.recipes = [
    ...TITLES.map((title) =>
      storedRecipe(title, { tags: ["Soup", "Stew"].includes(title) ? ["warm"] : [] }),
    ),
    storedRecipe("Old Stew", { archived: true }),
  ];
  // Always the first candidate, so the picks follow the recipe order.
  fake.random.mockReset().mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
});

const day = (label: string) => screen.getByRole("region", { name: label });
/** The pick shown on each day, or its text when it has none. */
const picks = () =>
  screen.getAllByRole("region").map((region) => {
    const link = within(region).queryByRole("link");
    return link
      ? link.textContent?.replace("Locked", "")
      : within(region).queryByText(/Skipped|Nothing to pick/)?.textContent;
  });

/** Opens the roller for the week of 2 Nov and delivers the nearby Plan days. */
function openRoller(days: PlanDays = {}) {
  const app = renderApp("/plan/roll?week=2026-11-02");
  act(() => fake.listeners.get(NEARBY)?.(days));
  return app;
}

async function rollAgain() {
  const roll = screen.getByRole("button", { name: "Roll" });
  await userEvent.click(roll);
  await waitFor(() => expect(roll).toBeEnabled(), { timeout: 2000 });
}

test("opens on the week and rolls once by itself, without repeats or recently planned recipes", () => {
  openRoller({
    "2026-10-25": [{ id: "1", recipeId: "pasta" }],
    "2026-11-04": [
      { id: "2", note: "Leftovers" },
      { id: "3", recipeId: "soup" },
    ],
  });

  expect(screen.getAllByRole("region").map((r) => r.getAttribute("aria-label"))).toEqual(WEEK);
  expect(screen.getByLabelText("From")).toHaveValue("2026-11-02");
  expect(screen.getByLabelText("To")).toHaveValue("2026-11-08");
  // Pasta and Soup are planned nearby; Old Stew is archived.
  expect(picks()).toEqual(["Salad", "Tacos", "Curry", "Stew", "Pie", "Omelette", "Risotto"]);
  expect(within(day("Wed 4 Nov")).getByText("Planned: Leftovers · Soup")).toBeInTheDocument();
});

test("Roll, Save and Discard come before the days, in a bar that sticks to the top", () => {
  openRoller();
  const actions = screen.getByRole("group", { name: "Roll actions" });
  expect(within(actions).getByRole("button", { name: "Roll" })).toBeInTheDocument();
  expect(within(actions).getByRole("button", { name: "Save" })).toBeInTheDocument();
  expect(within(actions).getByRole("button", { name: "Discard" })).toBeInTheDocument();
  const firstDay = day("Mon 2 Nov");
  expect(actions.compareDocumentPosition(firstDay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(actions).toHaveStyle({ position: "sticky", top: "0px" });
});

test("waits for the nearby Plan days before rolling", () => {
  renderApp("/plan/roll?week=2026-11-02");

  expect(screen.queryAllByRole("link", { name: "Pasta" })).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Roll" })).toBeDisabled();
});

test("Locked and Skipped days survive a roll; the others change", async () => {
  openRoller();
  await userEvent.click(screen.getByRole("button", { name: "Lock Mon 2 Nov" }));
  await userEvent.click(screen.getByRole("button", { name: "Skip Tue 3 Nov" }));
  expect(screen.getByRole("button", { name: "Lock Mon 2 Nov" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  fake.random.mockReturnValue(0.99); // now the last candidate
  await rollAgain();

  const after = picks();
  expect(after[0]).toBe("Pasta");
  expect(after[1]).toBe("Skipped");
  expect(after.slice(2)).not.toContain("Pasta");
  expect(after[2]).not.toBe("Salad");
  expect(new Set(after).size).toBe(7);
});

test("the tag filter limits the picks to recipes with any selected tag", async () => {
  openRoller();

  await userEvent.click(screen.getByRole("checkbox", { name: "warm" }));
  await rollAgain();

  for (const pick of picks()) expect(["Soup", "Stew"]).toContain(pick);
});

test("Save adds only Rolled and Locked days, then shows the Plan at that week", async () => {
  const { router } = openRoller();
  await userEvent.click(screen.getByRole("button", { name: "Lock Mon 2 Nov" }));
  await userEvent.click(screen.getByRole("button", { name: "Skip Tue 3 Nov" }));

  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(fake.saveRoll).toHaveBeenCalledWith([
    { date: "2026-11-02", recipeId: "pasta" },
    { date: "2026-11-04", recipeId: "salad" },
    { date: "2026-11-05", recipeId: "tacos" },
    { date: "2026-11-06", recipeId: "curry" },
    { date: "2026-11-07", recipeId: "stew" },
    { date: "2026-11-08", recipeId: "pie" },
  ]);
  expect(router.state.location.pathname).toBe("/plan");
  expect(router.state.location.search).toBe("?week=2026-11-02");
  expect(router.state.historyAction).toBe("REPLACE");
  expect(sessionStorage.getItem(ROLL_STORAGE_KEY)).toBeNull();
});

test("Discard saves nothing, forgets the roll and goes back to the Plan", async () => {
  const { router } = openRoller();

  await userEvent.click(screen.getByRole("button", { name: "Discard" }));

  expect(fake.saveRoll).not.toHaveBeenCalled();
  expect(router.state.location.pathname).toBe("/plan");
  expect(sessionStorage.getItem(ROLL_STORAGE_KEY)).toBeNull();
});

test("looking at a rolled recipe and coming back keeps the roll", async () => {
  const { router, back } = openRoller();
  await userEvent.click(screen.getByRole("button", { name: "Lock Thu 5 Nov" }));
  const before = picks();

  fake.random.mockReturnValue(0.99); // a new roll would now pick differently
  await userEvent.click(screen.getByRole("link", { name: "Tacos Locked" }));
  expect(router.state.location.pathname).toBe("/recipe/tacos");
  await back();
  act(() => fake.listeners.get(NEARBY)?.({}));

  expect(picks()).toEqual(before);
  expect(screen.getByRole("button", { name: "Lock Thu 5 Nov" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the range is kept to 28 days, and new days get picks", () => {
  openRoller();

  fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-12-15" } });
  act(() => fake.listeners.get("2026-11-04/2026-12-29")?.({}));

  expect(screen.getByLabelText("From")).toHaveValue("2026-11-18");
  expect(screen.getByLabelText("To")).toHaveValue("2026-12-15");
  expect(screen.getAllByRole("region")).toHaveLength(28);
  expect(picks().every((pick) => TITLES.includes(pick ?? ""))).toBe(true);
});

test("an earlier end moves the start back with it", () => {
  openRoller();

  fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-10-30" } });

  expect(screen.getByLabelText("From")).toHaveValue("2026-10-30");
  expect(screen.getAllByRole("region")).toHaveLength(1);
});

test("rolling shuffles titles first, unless the phone asks for reduced motion", async () => {
  openRoller();
  await userEvent.click(screen.getByRole("button", { name: "Roll" }));
  expect(screen.getByRole("button", { name: "Roll" })).toBeDisabled(); // shuffling
  await waitFor(() => expect(screen.getByRole("button", { name: "Roll" })).toBeEnabled(), {
    timeout: 2000,
  });

  const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
  try {
    sessionStorage.clear();
    openRoller();
    const rolls = screen.getAllByRole("button", { name: "Roll" });
    await userEvent.click(rolls.at(-1)!);
    expect(rolls.at(-1)).toBeEnabled(); // no shuffle: the results are there at once
  } finally {
    matchMedia.mockRestore();
  }
});

test("the Plan's menu opens the roller on the week on screen", async () => {
  const { router } = renderApp("/plan?week=2026-11-16");

  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  await userEvent.click(screen.getByRole("button", { name: "Roll…" }));

  expect(router.state.location.pathname).toBe("/plan/roll");
  expect(screen.getByLabelText("From")).toHaveValue("2026-11-16");
});
