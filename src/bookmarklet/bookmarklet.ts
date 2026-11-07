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

  // No ld+json Recipe: fall back to schema.org microdata (issue 08), as Valdemarsro writes it.
  const root = Array.from(doc.querySelectorAll("[itemscope][itemtype]")).find((element) =>
    (element.getAttribute("itemtype") || "")
      .split(/\s+/)
      .some((type) => /^https?:\/\/schema\.org\/Recipe$/.test(type)),
  );
  if (!root) return null;

  // An element's props are the itemprops whose nearest scope is that element, so nested scopes
  // (comments, the publisher's logo) keep theirs to themselves.
  const propsOf = (scope: Element) =>
    Array.from(scope.querySelectorAll("[itemprop]")).filter(
      (element) => element.parentElement?.closest("[itemscope]") === scope,
    );
  const namesOf = (element: Element) =>
    (element.getAttribute("itemprop") || "").split(/\s+/).filter(Boolean);
  // One line: markup line breaks and indentation inside an element aren't the site's text.
  const text = (element: Element) => (element.textContent || "").replace(/\s+/g, " ").trim();
  const paragraphs = (element: Element) =>
    Array.from(element.children)
      .filter((child) => child.tagName === "P" || child.tagName === "LI")
      .map(text)
      .filter(Boolean);
  const valueOf = (element: Element): unknown => {
    if (element.hasAttribute("itemscope")) {
      const object: JsonObject = {};
      const type = (element.getAttribute("itemtype") || "").split("/").pop();
      if (type) object["@type"] = type;
      for (const prop of propsOf(element)) {
        for (const name of namesOf(prop)) if (!(name in object)) object[name] = valueOf(prop);
      }
      return object;
    }
    for (const attribute of ["content", "datetime", "src", "href"]) {
      const value = element.getAttribute(attribute);
      if (value !== null) return value.trim();
    }
    const parts = paragraphs(element);
    return parts.length > 0 ? parts.join("\n") : text(element);
  };

  const values: Record<string, unknown[]> = {};
  const add = (key: string, value: unknown) => (values[key] = (values[key] || []).concat(value));
  const listsDone = new Set<Element>();
  for (const prop of propsOf(root)) {
    for (const name of namesOf(prop)) {
      if (!keys.includes(name)) continue;
      const list = prop.parentElement;
      if (name === "recipeIngredient" && list && /^[OU]L$/.test(list.tagName)) {
        // The whole list in order, so section headers between ingredients stay in place.
        if (listsDone.has(list)) continue;
        listsDone.add(list);
        for (const item of Array.from(list.children)) {
          if (namesOf(item).includes(name)) add(name, valueOf(item));
          else if (!item.hasAttribute("itemprop") && text(item)) add(name, "[" + text(item) + "]");
        }
      } else if (name === "recipeInstructions" && !prop.hasAttribute("itemscope")) {
        // One step per paragraph or list item.
        const steps = paragraphs(prop);
        add(name, steps.length > 0 ? steps : text(prop));
      } else {
        add(name, valueOf(prop));
      }
    }
  }

  const recipe: JsonObject = {};
  // A prop found once is a single value, except the lists the converter reads as lists.
  for (const [key, list] of Object.entries(values)) {
    recipe[key] =
      list.length === 1 && !/^recipe(Ingredient|Instructions)$/.test(key) ? list[0] : list;
  }
  return { v: 1, url, recipe };
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
 * e.g. `https://recipes.danijompero.com/`; the program opens `appUrl + "#/import?d=…"`.
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
