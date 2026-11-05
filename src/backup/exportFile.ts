// The "Export everything" file (US-2.6): one JSON document holding every recipe, image and menu
// day, keyed by document ID. Pure, so the seed script (US-2.7) can read it in Node too.

export const EXPORT_FORMAT = "recipe-app-export";
export const EXPORT_VERSION = 1;

/** A Firestore document as stored in the file: timestamps are ISO strings (see TIMESTAMP_FIELDS). */
export type ExportedDocument = Record<string, unknown>;

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  recipes: Record<string, ExportedDocument>;
  recipeImages: Record<string, ExportedDocument>;
  menuDays: Record<string, ExportedDocument>;
}

/** The file's sections, mapped to the Firestore collection each holds. */
export const SECTIONS = {
  recipes: "recipes",
  recipeImages: "recipe_images",
  menuDays: "menu_days",
} as const;

export type Section = keyof typeof SECTIONS;

/** Fields stored as Firestore timestamps, written to the file as ISO strings. */
export const TIMESTAMP_FIELDS: Record<Section, readonly string[]> = {
  recipes: ["createdAt", "updatedAt"],
  recipeImages: [],
  menuDays: ["updatedAt"],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function damaged(detail: string): Error {
  return new Error(`The export file is damaged: ${detail}.`);
}

/** Reads an export file's text, throwing an Error with a message fit to show the user. */
export function parseExportFile(text: string): ExportFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON.");
  }
  if (!isObject(data) || data["format"] !== EXPORT_FORMAT) {
    throw new Error("This isn't a recipe-app export file.");
  }
  if (data["version"] !== EXPORT_VERSION) {
    throw new Error(
      `This export is version ${String(data["version"])}, but this app can only restore version ${EXPORT_VERSION}.`,
    );
  }

  for (const section of Object.keys(SECTIONS) as Section[]) {
    const documents = data[section];
    if (!isObject(documents)) throw damaged(`"${section}" is missing or not an object`);
    for (const [id, document] of Object.entries(documents)) {
      if (!isObject(document)) throw damaged(`${section}/${id} is not an object`);
      for (const field of TIMESTAMP_FIELDS[section]) {
        const value = document[field];
        if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
          throw damaged(`${section}/${id} has an invalid ${field}`);
        }
      }
    }
  }
  return data as unknown as ExportFile;
}
