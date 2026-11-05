import { act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { MenuEntry, NewMenuEntry, PlanDays } from "../data/menu.ts";
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
  addEntry: vi.fn<(date: string, entry: NewMenuEntry) => Promise<unknown>>(),
  removeEntry: vi.fn<(date: string, entry: MenuEntry) => Promise<void>>(),
  moveEntry: vi.fn<(from: string, to: string, entry: MenuEntry) => Promise<void>>(),
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
  addEntry: fake.addEntry,
  removeEntry: fake.removeEntry,
  moveEntry: fake.moveEntry,
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
  fake.addEntry.mockReset().mockResolvedValue({ id: "new" });
  fake.removeEntry.mockReset().mockResolvedValue();
  fake.moveEntry.mockReset().mockResolvedValue();
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

describe("adding, removing and moving (US-5.2)", () => {
  /** The whole November 2026 calendar, as the date picker shows it: whole weeks, Mon–Sun. */
  const NOVEMBER_GRID = "2026-10-26/2026-12-06";

  test("adds a recipe found by searching, from the day's +", async () => {
    renderApp("/plan");
    act(() => fake.push(THIS_WEEK, {}));

    await userEvent.click(screen.getByRole("button", { name: "Add to Fri 6 Nov" }));
    const sheet = within(screen.getByRole("dialog", { name: "Add to Fri 6 Nov" }));
    await userEvent.type(sheet.getByRole("searchbox", { name: "Search recipes" }), "soup");
    expect(sheet.queryByRole("button", { name: "Spinach Pie" })).not.toBeInTheDocument();
    await userEvent.click(sheet.getByRole("button", { name: "Chicken Soup" }));

    expect(fake.addEntry).toHaveBeenCalledWith("2026-11-06", { recipeId: "chicken-soup" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("archived recipes aren't offered", async () => {
    renderApp("/plan");

    await userEvent.click(screen.getByRole("button", { name: "Add to Fri 6 Nov" }));

    const sheet = within(screen.getByRole("dialog", { name: "Add to Fri 6 Nov" }));
    expect(sheet.getByRole("button", { name: "Spinach Pie" })).toBeInTheDocument();
    expect(sheet.queryByRole("button", { name: "Old Stew" })).not.toBeInTheDocument();
  });

  test("adds a trimmed note, also to a past day", async () => {
    renderApp("/plan");

    await userEvent.click(screen.getByRole("button", { name: "Add to Mon 2 Nov" }));
    const sheet = within(screen.getByRole("dialog", { name: "Add to Mon 2 Nov" }));
    await userEvent.click(sheet.getByRole("tab", { name: "Note" }));
    await userEvent.type(sheet.getByRole("textbox", { name: "Note" }), "  Leftovers {Enter}");

    expect(fake.addEntry).toHaveBeenCalledWith("2026-11-02", { note: "Leftovers" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("an empty or too-long note can't be added", async () => {
    renderApp("/plan");
    await userEvent.click(screen.getByRole("button", { name: "Add to Fri 6 Nov" }));
    const sheet = within(screen.getByRole("dialog", { name: "Add to Fri 6 Nov" }));
    await userEvent.click(sheet.getByRole("tab", { name: "Note" }));
    const note = sheet.getByRole("textbox", { name: "Note" });
    const add = sheet.getByRole("button", { name: "Add" });

    expect(add).toBeDisabled();
    await userEvent.type(note, "   ");
    expect(add).toBeDisabled();

    await userEvent.clear(note);
    await userEvent.click(note);
    await userEvent.paste("x".repeat(81));
    expect(add).toBeDisabled();
    expect(sheet.getByText("A note can be at most 80 characters.")).toBeInTheDocument();

    await userEvent.type(note, "{Backspace}{Enter}");
    expect(fake.addEntry).toHaveBeenCalledWith("2026-11-06", { note: "x".repeat(80) });
  });

  test("removes an entry at once", async () => {
    renderApp("/plan");
    const pie = { id: "b", recipeId: "spinach-pie" };
    act(() => fake.push(THIS_WEEK, { "2026-11-05": [pie, { id: "c", note: "Salad" }] }));

    await userEvent.click(screen.getByRole("button", { name: "Options for Spinach Pie" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));

    expect(fake.removeEntry).toHaveBeenCalledWith("2026-11-05", pie);
  });

  test("a missing recipe can still be removed", async () => {
    renderApp("/plan");
    const gone = { id: "d", recipeId: "gone" };
    act(() => fake.push(THIS_WEEK, { "2026-11-06": [gone] }));

    await userEvent.click(screen.getByRole("button", { name: "Options for Missing recipe" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));

    expect(fake.removeEntry).toHaveBeenCalledWith("2026-11-06", gone);
  });

  test("moves an entry to the day picked in the calendar", async () => {
    renderApp("/plan");
    const salad = { id: "c", note: "Salad" };
    act(() => fake.push(THIS_WEEK, { "2026-11-05": [salad] }));

    await userEvent.click(screen.getByRole("button", { name: "Options for Salad" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Move to…" }));
    const picker = within(screen.getByRole("dialog", { name: "Move to…" }));
    await userEvent.click(picker.getByRole("button", { name: "Fri 20 Nov" }));

    expect(fake.moveEntry).toHaveBeenCalledWith("2026-11-05", "2026-11-20", salad);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("the calendar marks days that already have entries, and stops watching when closed", async () => {
    renderApp("/plan");
    act(() => fake.push(THIS_WEEK, { "2026-11-05": [{ id: "c", note: "Salad" }] }));

    await userEvent.click(screen.getByRole("button", { name: "Options for Salad" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Move to…" }));
    act(() =>
      fake.push(NOVEMBER_GRID, {
        "2026-11-05": [{ id: "c", note: "Salad" }],
        "2026-11-20": [{ id: "e", recipeId: "chicken-soup" }],
        "2026-11-21": [],
      }),
    );

    const picker = within(screen.getByRole("dialog", { name: "Move to…" }));
    expect(picker.getByRole("button", { name: "Fri 20 Nov, has meals" })).toBeInTheDocument();
    expect(picker.getByRole("button", { name: "Thu 5 Nov, has meals" })).toBeInTheDocument();
    expect(picker.getByRole("button", { name: "Sat 21 Nov" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(fake.listeners.has(NOVEMBER_GRID)).toBe(false);
    expect(fake.moveEntry).not.toHaveBeenCalled();
  });

  test("a change that fails to save shows why", async () => {
    fake.removeEntry.mockRejectedValue(new Error("Missing or insufficient permissions."));
    renderApp("/plan");
    act(() => fake.push(THIS_WEEK, { "2026-11-05": [{ id: "c", note: "Salad" }] }));

    await userEvent.click(screen.getByRole("button", { name: "Options for Salad" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));

    expect(await screen.findByText("Couldn't save the change")).toBeInTheDocument();
    expect(screen.getByText("Missing or insufficient permissions.")).toBeInTheDocument();
  });
});
