// The Data page's Export and Restore sections (US-2.6), with the backup module faked.
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/react";
import type { ExportFile } from "../backup/exportFile.ts";
import { render, screen } from "../test-utils/render.tsx";
import { DataPage } from "./DataPage.tsx";

const fakes = vi.hoisted(() => ({
  exportEverything: vi.fn<() => Promise<ExportFile>>(),
  restoreEverything:
    vi.fn<
      (file: ExportFile, onProgress?: (done: number, total: number) => void) => Promise<void>
    >(),
}));

vi.mock("../data/backup.ts", () => ({
  exportEverything: fakes.exportEverything,
  restoreEverything: fakes.restoreEverything,
}));
// The import section's database calls aren't under test here.
vi.mock("../data/recipes.ts", () => ({ existingRecipeIds: vi.fn(), saveRecipes: vi.fn() }));

const exportFile: ExportFile = {
  format: "recipe-app-export",
  version: 1,
  exportedAt: "2026-11-03T21:15:00.000Z",
  recipes: {
    pasta: {
      title: "Pasta",
      createdAt: "2026-11-03T19:00:00.000Z",
      updatedAt: "2026-11-03T19:00:00.000Z",
    },
    soup: {
      title: "Soup",
      createdAt: "2026-11-03T19:00:00.000Z",
      updatedAt: "2026-11-03T19:00:00.000Z",
    },
  },
  recipeImages: { pasta: { data: "data:image/jpeg;base64,AAAA" } },
  menuDays: { "2026-11-04": { entries: [], updatedAt: "2026-11-03T20:00:00.000Z" } },
};

let downloads: { name: string; blob: Blob }[];

beforeEach(() => {
  fakes.exportEverything.mockReset().mockResolvedValue(exportFile);
  fakes.restoreEverything.mockReset().mockImplementation((_file, onProgress) => {
    onProgress?.(4, 4);
    return Promise.resolve();
  });
  // jsdom can't download: record what the page asks the browser to save instead.
  downloads = [];
  const blobs = new Map<string, Blob>();
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    const url = `blob:${blobs.size}`;
    blobs.set(url, blob as Blob);
    return url;
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push({ name: this.download, blob: blobs.get(this.href) ?? new Blob() });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("Export everything downloads the export as a dated JSON file", async () => {
  const user = userEvent.setup();
  render(<DataPage />);

  await user.click(screen.getByRole("button", { name: "Export everything" }));

  expect(
    await screen.findByText("Exported 2 recipes, 1 photo and 1 menu day."),
  ).toBeInTheDocument();
  expect(downloads.map((download) => download.name)).toEqual(["recipe-app-export-2026-11-03.json"]);
  expect(JSON.parse(await downloads[0]!.blob.text())).toEqual(exportFile);
});

test("a failed export says so", async () => {
  fakes.exportEverything.mockRejectedValue(new Error("Missing or insufficient permissions."));
  const user = userEvent.setup();
  render(<DataPage />);

  await user.click(screen.getByRole("button", { name: "Export everything" }));

  expect(
    await screen.findByText("Export failed: Missing or insufficient permissions."),
  ).toBeInTheDocument();
  expect(downloads).toEqual([]);
});

async function pickRestoreFile(contents: string) {
  const user = userEvent.setup();
  render(<DataPage />);
  await user.upload(
    screen.getByLabelText("Choose an export file"),
    new File([contents], "recipe-app-export-2026-11-03.json", { type: "application/json" }),
  );
  return user;
}

test("Restore shows what the file holds, asks first, then restores it with progress", async () => {
  const user = await pickRestoreFile(JSON.stringify(exportFile));

  expect(
    await screen.findByText(
      "This file holds 2 recipes, 1 photo and 1 menu day, exported on 2026-11-03.",
    ),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Restore" }));
  const dialog = await screen.findByRole("dialog");
  expect(
    within(dialog).getByText(
      "Everything in the file replaces the version in the app. Nothing that isn't in the file is changed or deleted.",
    ),
  ).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Restore" }));

  expect(await screen.findByText("Restored 4 documents.")).toBeInTheDocument();
  expect(fakes.restoreEverything).toHaveBeenCalledWith(exportFile, expect.any(Function));
});

test("Cancel in the restore dialog restores nothing", async () => {
  const user = await pickRestoreFile(JSON.stringify(exportFile));

  await user.click(await screen.findByRole("button", { name: "Restore" }));
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }),
  );

  expect(fakes.restoreEverything).not.toHaveBeenCalled();
});

test("a file that isn't an export is refused with the reason", async () => {
  await pickRestoreFile(JSON.stringify({ format: "something-else" }));

  expect(await screen.findByText("This isn't a recipe-app export file.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument();
});

test("a failed restore shows the error", async () => {
  fakes.restoreEverything.mockRejectedValue(new Error("Missing or insufficient permissions."));
  const user = await pickRestoreFile(JSON.stringify(exportFile));

  await user.click(await screen.findByRole("button", { name: "Restore" }));
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", { name: "Restore" }),
  );

  expect(
    await screen.findByText("Restore failed: Missing or insufficient permissions."),
  ).toBeInTheDocument();
});

test("while the phone says it's offline, Restore is disabled with a note; Export still works", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  await pickRestoreFile(JSON.stringify(exportFile));

  expect(await screen.findByRole("button", { name: "Restore" })).toBeDisabled();
  expect(screen.getByText("Needs a connection")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Export everything" })).toBeEnabled();
  vi.restoreAllMocks();
});
