import { act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "../data/auth.ts";
import type { GroceryList } from "../data/groceries.ts";
import type { SourceLine } from "../groceries/types.ts";
import { renderApp, screen } from "../test-utils/renderApp.tsx";

// Fake the data seam: a signed-in member and a grocery list the tests can change.
const fake = vi.hoisted(() => ({
  listener: null as ((list: GroceryList) => void) | null,
  tick: vi.fn<(ids: string[]) => Promise<void>>(),
  untick: vi.fn<(ids: string[]) => Promise<void>>(),
  addHandLine: vi.fn<(raw: string) => Promise<unknown>>(),
  removeLines: vi.fn<(lines: SourceLine[]) => Promise<void>>(),
  clearList: vi.fn<() => Promise<void>>(),
  push(list: Partial<GroceryList>) {
    fake.listener?.({ lines: [], ticked: [], updatedAt: null, ...list });
  },
}));
vi.mock("../data/groceries.ts", () => ({
  HAND_LINE_MAX: 80,
  watchGroceryList: (onChange: (list: GroceryList) => void) => {
    fake.listener = onChange;
    return () => {
      fake.listener = null;
    };
  },
  tick: fake.tick,
  untick: fake.untick,
  addHandLine: fake.addHandLine,
  removeLines: fake.removeLines,
  clearList: fake.clearList,
  replaceList: vi.fn(),
  addLines: vi.fn(),
}));
vi.mock("../data/menu.ts", () => ({ watchDays: () => () => {} }));
vi.mock("../data/recipes.ts", () => ({
  watchRecipes: (onChange: (recipes: unknown[]) => void) => {
    onChange([]);
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

const MILK_PASTA: SourceLine = {
  id: "l1",
  raw: "1 dl milk",
  scale: 2,
  recipeId: "pasta",
  title: "Pasta",
  entryId: "e1",
};
const MILK_SOUP: SourceLine = {
  id: "l2",
  raw: "3 dl milk",
  scale: 1,
  recipeId: "soup",
  title: "Soup",
  entryId: "e2",
};
const PASTA: SourceLine = { ...MILK_PASTA, id: "l3", raw: "400 g pasta" };
const ONION: SourceLine = { ...MILK_SOUP, id: "l4", raw: "1 onion" };
const PAPER: SourceLine = { id: "h1", raw: "toilet paper", scale: 1 };
const LINES = [MILK_PASTA, MILK_SOUP, PASTA, ONION, PAPER];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 6, 18, 0));
  localStorage.clear();
  fake.listener = null;
  for (const write of [fake.tick, fake.untick, fake.removeLines, fake.clearList]) {
    write.mockReset().mockResolvedValue();
  }
  fake.addHandLine.mockReset().mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

function openList(list: Partial<GroceryList> = { lines: LINES }) {
  const app = renderApp("/groceries");
  act(() => fake.push(list));
  return app;
}

/** The merged line's row, by its name. */
const row = (name: string) => screen.getByRole("listitem", { name });

test("with no list, links to the builder", async () => {
  const { router } = openList({});

  expect(screen.getByText("No grocery list yet.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("link", { name: "Build one" }));
  expect(router.state.location.pathname).toBe("/groceries/new");
});

test("the merged view: one line per thing to buy, A–Z, with combined amounts", () => {
  openList({ lines: LINES, updatedAt: new Date(2026, 10, 6, 17, 30) });

  const rows = screen.getAllByRole("listitem").map((item) => item.textContent);
  expect(rows).toEqual(["milk5 dl", "onion1", "pasta800 g", "toilet paper"]);
  expect(screen.getByText("Changed 17:30")).toBeInTheDocument();
});

test("a line is ticked when all its sources are, partly ticked when some are", () => {
  openList({ lines: LINES, ticked: ["l1", "l3"] });

  expect(within(row("milk")).getByRole("checkbox")).toBePartiallyChecked();
  expect(within(row("pasta")).getByRole("checkbox")).toBeChecked();
  expect(within(row("onion")).getByRole("checkbox")).not.toBeChecked();
});

test("a ticked line stays in place, crossed out", () => {
  openList({ lines: LINES, ticked: ["l3"] });

  expect(screen.getAllByRole("listitem")[2]).toBe(row("pasta"));
  expect(row("pasta")).toHaveAttribute("data-ticked");
  expect(row("milk")).not.toHaveAttribute("data-ticked");
});

test("ticking a merged line ticks all its sources; unticking unticks them", async () => {
  openList({ lines: LINES, ticked: ["l1", "l3"] });

  await userEvent.click(within(row("milk")).getByRole("checkbox"));
  expect(fake.tick).toHaveBeenCalledWith(["l1", "l2"]);

  await userEvent.click(within(row("pasta")).getByRole("checkbox"));
  expect(fake.untick).toHaveBeenCalledWith(["l3"]);
});

test("tapping a line shows where it came from, and a source can be removed", async () => {
  openList();

  await userEvent.click(within(row("milk")).getByRole("button", { name: /milk/ }));
  const sources = within(row("milk"));
  expect(sources.getByText("2 dl milk")).toBeInTheDocument();
  expect(sources.getByText("Pasta")).toBeInTheDocument();
  expect(sources.getByText("3 dl milk")).toBeInTheDocument();
  expect(sources.getByText("Soup")).toBeInTheDocument();

  await userEvent.click(sources.getByRole("button", { name: "Remove 2 dl milk (Pasta)" }));
  expect(fake.removeLines).toHaveBeenCalledWith([MILK_PASTA]);
});

test("a line added by hand says so in its sources", async () => {
  openList();

  await userEvent.click(within(row("toilet paper")).getByRole("button", { name: /toilet paper/ }));
  expect(within(row("toilet paper")).getByText("Added by hand")).toBeInTheDocument();
});

describe("by recipe", () => {
  async function openByRecipe(list: Partial<GroceryList> = { lines: LINES }) {
    const app = openList(list);
    await userEvent.click(screen.getByRole("radio", { name: "By recipe" }));
    return app;
  }

  test("each recipe's own lines, scaled, with the hand-added ones last", async () => {
    await openByRecipe({ lines: LINES, ticked: ["l4"] });

    const pasta = within(screen.getByRole("group", { name: "Pasta 2×" }));
    expect(pasta.getByRole("checkbox", { name: "2 dl milk" })).not.toBeChecked();
    expect(pasta.getByRole("checkbox", { name: "800 g pasta" })).toBeInTheDocument();
    const soup = within(screen.getByRole("group", { name: "Soup" }));
    expect(soup.getByRole("checkbox", { name: "1 onion" })).toBeChecked();
    const groups = screen.getAllByRole("group").map((group) => group.getAttribute("aria-label"));
    expect(groups).toEqual(["Pasta 2×", "Soup", "Added by hand"]);
  });

  test("ticks are the same ticks as the merged view", async () => {
    await openByRecipe();

    await userEvent.click(screen.getByRole("checkbox", { name: "1 onion" }));
    expect(fake.tick).toHaveBeenCalledWith(["l4"]);
  });

  test("a whole recipe can be removed, after asking", async () => {
    await openByRecipe();

    await userEvent.click(screen.getByRole("button", { name: "Remove Pasta" }));
    const dialog = within(screen.getByRole("dialog", { name: "Remove Pasta from the list?" }));
    await userEvent.click(dialog.getByRole("button", { name: "Remove" }));

    expect(fake.removeLines).toHaveBeenCalledWith([MILK_PASTA, PASTA]);
  });

  test("the view is remembered", async () => {
    const { unmount } = await openByRecipe();
    unmount();

    openList();
    expect(screen.getByRole("radio", { name: "By recipe" })).toBeChecked();
  });
});

test("adds an item by hand, then clears the field", async () => {
  openList();

  const field = screen.getByRole("textbox", { name: "Add an item" });
  expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  await userEvent.type(field, "2 dl cream{Enter}");

  expect(fake.addHandLine).toHaveBeenCalledWith("2 dl cream");
  expect(field).toHaveValue("");
});

test("clears the list after asking", async () => {
  openList();

  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  await userEvent.click(screen.getByRole("button", { name: "Clear list" }));
  const dialog = within(screen.getByRole("dialog", { name: "Clear the list?" }));
  await userEvent.click(dialog.getByRole("button", { name: "Clear" }));

  expect(fake.clearList).toHaveBeenCalledOnce();
});

test("a change that fails to save shows why", async () => {
  fake.tick.mockRejectedValue(new Error("Missing or insufficient permissions."));
  openList();

  await userEvent.click(within(row("onion")).getByRole("checkbox"));

  expect(await screen.findByText("Couldn't save the change")).toBeInTheDocument();
  expect(screen.getByText("Missing or insufficient permissions.")).toBeInTheDocument();
});

test("the menu lists the grocery list", async () => {
  const { router } = renderApp("/plan");

  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  await userEvent.click(screen.getByRole("button", { name: "Grocery list" }));

  expect(router.state.location.pathname).toBe("/groceries");
});
