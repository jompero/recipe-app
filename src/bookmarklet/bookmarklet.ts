/**
 * The recipe bookmarklet (EPIC-4, US-4.4): run on a recipe website, it reads the page's schema.org
 * Recipe from its `ld+json` blocks and opens the app's `#/import?d=` route in the same tab, with a
 * `RecipePayload` (src/import/recipePayload.ts) as base64url-encoded UTF-8 JSON.
 *
 * How it is built: `findRecipe`, `encodePayload` and `runBookmarklet` are **self-contained**: they
 * use nothing from outside their own body (no imports, no module constants, not each other by
 * name). `bookmarkletHref` turns their source text (`Function.prototype.toString`) into a
 * `javascript:` program and passes the payload keys and the app URL in as arguments. So the code
 * that runs on a site is exactly the code tested here, and `vite build` minifies it with the rest
 * of the bundle (Oxc, Vite's default client minifier); `vite dev` and Vitest run it unminified.
 * No Vite plugin is needed. Keep the three functions self-contained, or the link breaks.
 *
 * It must not depend on the page, and must not use fetch, popups or postMessage (spec).
 */
import { RECIPE_PAYLOAD_KEYS, type RecipePayload } from "../import/recipePayload";

/** The parts of `window` the program uses, so tests can pass a fake. */
interface BookmarkletWindow {
  document: Document;
  location: { href: string };
  alert(message: string): void;
}

/**
 * Finds the schema.org Recipe in `doc`'s `<script type="application/ld+json">` blocks: a single
 * object, an array or `@graph`, with `@type` a string or an array containing "Recipe". Blocks that
 * fail to parse are skipped. `@id` references in `image`, `author` and `publisher` are inlined from
 * the same block (fields written next to the `@id` win). Keeps only `keys`. Self-contained.
 */
export function findRecipe(
  doc: Document,
  url: string,
  keys: readonly string[],
): RecipePayload | null {
  type JsonObject = Record<string, unknown>;
  const isObject = (x: unknown): x is JsonObject =>
    typeof x === "object" && x !== null && !Array.isArray(x);
  const collect = (x: unknown, into: JsonObject[]): JsonObject[] => {
    if (Array.isArray(x)) {
      for (const item of x) collect(item, into);
    } else if (isObject(x)) {
      into.push(x);
      if (x["@graph"]) collect(x["@graph"], into);
    }
    return into;
  };
  const isRecipe = (node: JsonObject) => {
    const type = node["@type"];
    return type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
  };

  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let data: unknown;
    try {
      data = JSON.parse(script.textContent || "");
    } catch {
      continue;
    }
    const nodes = collect(data, []);
    const recipe = nodes.find(isRecipe);
    if (!recipe) continue;

    const byId = new Map<unknown, JsonObject>();
    for (const node of nodes) if (typeof node["@id"] === "string") byId.set(node["@id"], node);
    const inline = (x: unknown): unknown => {
      if (Array.isArray(x)) return x.map(inline);
      const target = isObject(x) ? byId.get(x["@id"]) : undefined;
      return target && isObject(x) ? { ...target, ...x } : x;
    };

    const trimmed: JsonObject = {};
    for (const key of keys) {
      if (!(key in recipe)) continue;
      const value = recipe[key];
      trimmed[key] =
        key === "image" || key === "author" || key === "publisher" ? inline(value) : value;
    }
    return { v: 1, url, recipe: trimmed };
  }
  return null;
}

/** Encodes a payload as UTF-8 JSON → base64url, without padding. Self-contained. */
export function encodePayload(payload: RecipePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The bookmarklet program: navigate the same tab to the app's import route, or alert and stay
 * when the page has no recipe. Its helpers come in as arguments. Self-contained.
 */
export function runBookmarklet(
  win: BookmarkletWindow,
  appUrl: string,
  keys: readonly string[],
  find: typeof findRecipe,
  encode: typeof encodePayload,
): void {
  const payload = find(win.document, win.location.href, keys);
  if (!payload) {
    win.alert(
      "No recipe found on this page. Copy the recipe text and use Paste recipe in the app.",
    );
    return;
  }
  win.location.href = appUrl + "#/import?d=" + encode(payload);
}

/** Where `bookmarkletHref` puts the app URL (as a JSON string literal). */
const APP_URL_PLACEHOLDER = "__APP_URL__";

/** The whole program, built once from the functions' source, with the app URL still a placeholder. */
const PROGRAM = `(${runBookmarklet.toString()})(window,${APP_URL_PLACEHOLDER},${JSON.stringify(
  RECIPE_PAYLOAD_KEYS,
)},${findRecipe.toString()},${encodePayload.toString()})`;

/**
 * The `javascript:` link for the install page (issue 07). `appUrl` is the app's origin plus path,
 * e.g. `http://localhost:5173/recipe-app/`; the program opens `appUrl + "#/import?d=…"`.
 *
 * Browsers percent-decode a `javascript:` URL before running it and drop raw newlines and tabs
 * (which would let a `//` comment swallow the rest), so `%`, newlines and tabs are percent-encoded.
 */
export function bookmarkletHref(appUrl: string): string {
  const program = PROGRAM.replace(APP_URL_PLACEHOLDER, () => JSON.stringify(appUrl));
  return "javascript:" + program.replace(/[%\n\r\t]/g, encodeURIComponent);
}

/** `findRecipe` with the payload keys from the shared contract, for the app and tests. */
export function extractRecipe(doc: Document, url: string): RecipePayload | null {
  return findRecipe(doc, url, RECIPE_PAYLOAD_KEYS);
}
