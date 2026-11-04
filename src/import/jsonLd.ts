// Turns the recipe a bookmarklet read from a page's `ld+json` (EPIC-4, US-4.3) into a draft for
// the New recipe form. Sites write schema.org in many shapes, so every field is read defensively:
// anything unexpected gives an empty value, never an error.
import { textToIngredients, textToInstructions } from "../parsing/blockText.ts";
import type { RecipeDraft } from "../parsing/types.ts";
import { durationMinutes, formatDuration, formatMinutes } from "./duration.ts";
import type { RecipePayload } from "./recipePayload.ts";

export interface ConvertedRecipe {
  draft: RecipeDraft;
  /** The site's photo, to try to fetch (most sites don't allow it), or null if there is none. */
  photoUrl: string | null;
}

export function payloadToDraft(payload: RecipePayload): ConvertedRecipe {
  const recipe = isObject(payload.recipe) ? payload.recipe : {};
  const pageUrl = typeof payload.url === "string" ? payload.url : "";

  return {
    draft: {
      title: oneLine(recipe.name),
      description: textLines(recipe.description).join("\n"),
      source: publisherName(recipe.publisher) || hostname(pageUrl),
      sourceUrl: pageUrl,
      yield: mostDescriptiveYield(recipe.recipeYield),
      activeTime: formatDuration(recipe.prepTime),
      totalTime: totalTime(recipe),
      // Site keywords and categories are too noisy to use as tags.
      tags: [],
      ingredients: textToIngredients(ingredientLines(recipe).join("\n")),
      instructions: textToInstructions(instructionLines(recipe.recipeInstructions).join("\n")),
    },
    photoUrl: firstImageUrl(recipe.image, pageUrl),
  };
}

// --- Text ---------------------------------------------------------------------------------------

/** Tags that end a line of text, so `<p>a</p><p>b</p>` reads as two lines. */
const LINE_BREAK_TAGS = /<br\s*\/?>|<\/(?:p|div|li|h[1-6]|tr)\s*>/gi;

/**
 * Site text as lines: tags stripped (script and style contents dropped), entities decoded,
 * whitespace tidied and blank lines removed. Anything but a string gives no lines.
 */
function textLines(value: unknown): string[] {
  if (typeof value !== "string") return [];
  // The parsed document is inert: no scripts run and no images load.
  const doc = new DOMParser().parseFromString(value.replace(LINE_BREAK_TAGS, "$&\n"), "text/html");
  doc.querySelectorAll("script, style, template").forEach((element) => element.remove());
  return (doc.body.textContent ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line !== "");
}

/** Site text as a single line. Numbers are allowed too, since some sites write them bare. */
function oneLine(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return textLines(value).join(" ");
}

// --- Ingredients and instructions ---------------------------------------------------------------

function listLines(value: unknown): string[] {
  if (typeof value === "string") return textLines(value);
  if (!Array.isArray(value)) return [];
  return value.map(oneLine).filter((line) => line !== "");
}

function ingredientLines(recipe: RecipePayload["recipe"]): string[] {
  const lines = listLines(recipe.recipeIngredient);
  return lines.length > 0 ? lines : listLines(recipe.ingredients);
}

/**
 * Instructions as lines, with `[Header]` lines for sections. Takes a string (split on line
 * breaks), an array, HowToStep (its text, else its name, else its own item list) and HowToSection
 * (possibly nested).
 */
function instructionLines(value: unknown): string[] {
  if (typeof value === "string") return textLines(value);
  if (Array.isArray(value)) return value.flatMap((item) => stepLines(item));
  return stepLines(value);
}

function stepLines(item: unknown): string[] {
  if (typeof item === "string") {
    // One array entry is one step, even if the site put line breaks in it.
    const line = oneLine(item);
    return line === "" ? [] : [line];
  }
  if (Array.isArray(item)) return instructionLines(item);
  if (!isObject(item)) return [];

  if (types(item).includes("HowToSection")) {
    const header = oneLine(item.name);
    const lines = instructionLines(item.itemListElement);
    return header === "" ? lines : [`[${header}]`, ...lines];
  }
  const text = oneLine(item.text) || oneLine(item.name);
  if (text !== "") return [text];
  return instructionLines(item.itemListElement);
}

// --- Yield, times and source --------------------------------------------------------------------

/** The longest of the yields, so "12 cookies" wins over "12". */
function mostDescriptiveYield(value: unknown): string {
  const candidates = (Array.isArray(value) ? value : [value]).map(oneLine);
  return candidates.reduce((best, next) => (next.length > best.length ? next : best), "");
}

/** `totalTime`, or prep plus cook (whichever of them there is) if it's missing or unreadable. */
function totalTime(recipe: RecipePayload["recipe"]): string {
  const total = durationMinutes(recipe.totalTime);
  if (total !== null && total > 0) return formatMinutes(total);
  const parts = [durationMinutes(recipe.prepTime), durationMinutes(recipe.cookTime)];
  if (parts.every((part) => part === null)) return "";
  return formatMinutes(parts.reduce<number>((sum, part) => sum + (part ?? 0), 0));
}

function publisherName(value: unknown): string {
  for (const publisher of Array.isArray(value) ? value : [value]) {
    const name = isObject(publisher) ? oneLine(publisher.name) : oneLine(publisher);
    if (name !== "") return name;
  }
  return "";
}

/** The page's hostname without `www.`, or an empty string if the URL can't be read. */
function hostname(pageUrl: string): string {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// --- Photo --------------------------------------------------------------------------------------

/**
 * The first usable image URL: from a string, an array, or an ImageObject (`url`, else
 * `contentUrl`). Relative URLs are resolved against the page; only http(s) is usable.
 */
function firstImageUrl(value: unknown, pageUrl: string): string | null {
  if (typeof value === "string") return usableUrl(value, pageUrl);
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstImageUrl(item, pageUrl);
      if (url !== null) return url;
    }
    return null;
  }
  if (isObject(value)) {
    return firstImageUrl(value.url, pageUrl) ?? firstImageUrl(value.contentUrl, pageUrl);
  }
  return null;
}

function usableUrl(value: string, pageUrl: string): string | null {
  const text = value.trim();
  if (text === "") return null;
  const url = parseUrl(text, pageUrl) ?? parseUrl(text);
  return url?.protocol === "https:" || url?.protocol === "http:" ? url.href : null;
}

function parseUrl(text: string, base?: string): URL | null {
  try {
    return new URL(text, base);
  } catch {
    return null;
  }
}

// --- Helpers ------------------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function types(item: Record<string, unknown>): unknown[] {
  const type = item["@type"];
  return Array.isArray(type) ? type : [type];
}
