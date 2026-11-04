import { RECIPE_PAYLOAD_KEYS, type RecipePayload } from "../import/recipePayload";
import { bookmarkletHref, encodePayload, extractRecipe } from "./bookmarklet";
import arrayHtml from "./fixtures/array.html?raw";
import brokenAndGoodHtml from "./fixtures/broken-and-good.html?raw";
import graphHtml from "./fixtures/graph.html?raw";
import noRecipeHtml from "./fixtures/no-recipe.html?raw";
import plainObjectHtml from "./fixtures/plain-object.html?raw";
import typeArrayHtml from "./fixtures/type-array.html?raw";

const PAGE_URL = "https://example.com/recipe/";
const APP_URL = "http://localhost:5173/recipe-app/";
const NO_RECIPE_ALERT =
  "No recipe found on this page. Copy the recipe text and use Paste recipe in the app.";

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/** Base64url (no padding) → UTF-8 JSON. Deliberately separate from issue 03's codec. */
function decode(encoded: string): unknown {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

describe("extractRecipe", () => {
  it("reads a plain Recipe object and keeps only the payload keys", () => {
    const payload = extractRecipe(parse(plainObjectHtml), PAGE_URL);

    expect(payload).toEqual({
      v: 1,
      url: PAGE_URL,
      recipe: {
        name: "Pancakes",
        description: "Thin pancakes",
        recipeIngredient: ["2 eggs", "3 dl milk"],
        recipeInstructions: "Whisk and fry.",
        recipeYield: ["4", "4 servings"],
        prepTime: "PT10M",
        totalTime: "PT30M",
        image: "https://example.com/pancakes.jpg",
        author: { "@type": "Person", name: "Ann" },
      },
    });
    for (const key of Object.keys(payload!.recipe)) {
      expect(RECIPE_PAYLOAD_KEYS).toContain(key);
    }
  });

  it("finds the Recipe in a top-level array", () => {
    const payload = extractRecipe(parse(arrayHtml), PAGE_URL);

    expect(payload?.recipe.name).toBe("Rødgrød med fløde");
    expect(payload?.recipe.recipeInstructions).toEqual([
      { "@type": "HowToStep", text: "Kog bærrene." },
    ]);
  });

  it("finds the Recipe in @graph and inlines @id references for image, author and publisher", () => {
    const payload = extractRecipe(parse(graphHtml), PAGE_URL);

    expect(payload?.recipe).toEqual({
      name: "Kanelsnegle",
      image: {
        "@type": "ImageObject",
        "@id": "https://example.com/kanelsnegle/#primaryimage",
        url: "https://example.com/kanelsnegle.jpg",
        width: 1200,
        height: 800,
      },
      author: { "@type": "Person", "@id": "https://example.com/#/schema/person/1", name: "Mette" },
      publisher: {
        "@type": "Organization",
        "@id": "https://example.com/#organization",
        name: "Example Kitchen",
        logo: { "@id": "https://example.com/#logo" },
      },
      recipeIngredient: ["500 g mel"],
      recipeInstructions: [{ "@type": "HowToStep", text: "Ælt dejen." }],
    });
  });

  it("inlines references inside an array and keeps fields written next to the @id", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@graph": [
        { "@id": "#img1", "@type": "ImageObject", url: "https://example.com/1.jpg" },
        { "@id": "#ann", "@type": "Person", name: "Ann", url: "https://example.com/ann" },
        {
          "@type": "Recipe",
          image: [{ "@id": "#img1" }, "https://example.com/2.jpg", { "@id": "#missing" }],
          author: { "@id": "#ann", name: "Ann B." },
        },
      ],
    })}</script>`;

    const payload = extractRecipe(parse(html), PAGE_URL);

    expect(payload?.recipe.image).toEqual([
      { "@id": "#img1", "@type": "ImageObject", url: "https://example.com/1.jpg" },
      "https://example.com/2.jpg",
      { "@id": "#missing" },
    ]);
    expect(payload?.recipe.author).toEqual({
      "@id": "#ann",
      "@type": "Person",
      name: "Ann B.",
      url: "https://example.com/ann",
    });
  });

  it("accepts @type as an array containing Recipe", () => {
    expect(extractRecipe(parse(typeArrayHtml), PAGE_URL)?.recipe.name).toBe("Karjalanpiirakat");
  });

  it("skips a block that fails to parse and uses the good one next to it", () => {
    expect(extractRecipe(parse(brokenAndGoodHtml), PAGE_URL)?.recipe.name).toBe("Good soup");
  });

  it("returns null when the page has no Recipe", () => {
    expect(extractRecipe(parse(noRecipeHtml), PAGE_URL)).toBeNull();
    expect(extractRecipe(parse("<p>Nothing here</p>"), PAGE_URL)).toBeNull();
  });
});

describe("encodePayload", () => {
  it("encodes UTF-8 JSON as base64url without padding, and decodes back (æøå, äö)", () => {
    const payload: RecipePayload = {
      v: 1,
      url: "https://example.com/rødgrød?x=1&y=2",
      recipe: { name: "Rødgrød med fløde, æøå ÆØÅ", description: "Hyvää ruokahalua, äö ÄÖ 🍓" },
    };

    const encoded = encodePayload(payload);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decode(encoded)).toEqual(payload);
  });

  it("round-trips every padding length", () => {
    for (const name of ["a", "ab", "abc", "abcd", "ø", "øø"]) {
      const payload: RecipePayload = { v: 1, url: "u", recipe: { name } };
      expect(decode(encodePayload(payload))).toEqual(payload);
    }
  });
});

describe("bookmarkletHref", () => {
  it("is a javascript: URL containing the app URL, well under bookmark limits", () => {
    const href = bookmarkletHref("http://localhost:5173/");

    expect(href.startsWith("javascript:")).toBe(true);
    expect(href).toContain("http://localhost:5173/");
    expect(href.length).toBeLessThan(5000);
  });

  it("has no raw newlines, tabs or stray % that a browser would mangle", () => {
    const href = bookmarkletHref("http://localhost:5173/a%20b/");

    expect(href).not.toMatch(/[\n\r\t]/);
    expect(href).not.toMatch(/%(?![0-9A-F]{2})/);
  });

  /** Runs the href the way a browser does: percent-decode, then evaluate with `window` bound. */
  function runHref(href: string, html: string, pageUrl = PAGE_URL) {
    const win = {
      document: parse(html),
      location: { href: pageUrl },
      alert: vi.fn(),
    };
    const code = decodeURIComponent(href.slice("javascript:".length));
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- that's what a bookmarklet is
    const program = new Function("window", code) as (window: typeof win) => void;
    program(win);
    return win;
  }

  it("navigates the same tab to the app's import route with the encoded payload", () => {
    const win = runHref(bookmarkletHref(APP_URL), graphHtml);

    expect(win.alert).not.toHaveBeenCalled();
    const prefix = `${APP_URL}#/import?d=`;
    expect(win.location.href.startsWith(prefix)).toBe(true);
    expect(decode(win.location.href.slice(prefix.length))).toEqual(
      extractRecipe(parse(graphHtml), PAGE_URL),
    );
  });

  it("alerts and stays on the page when there is no recipe", () => {
    const win = runHref(bookmarkletHref(APP_URL), noRecipeHtml);

    expect(win.alert).toHaveBeenCalledExactlyOnceWith(NO_RECIPE_ALERT);
    expect(win.location.href).toBe(PAGE_URL);
  });

  it("keeps an app URL with a percent sign intact", () => {
    const appUrl = "http://localhost:5173/a%20b/";
    const win = runHref(bookmarkletHref(appUrl), plainObjectHtml);

    expect(win.location.href.startsWith(`${appUrl}#/import?d=`)).toBe(true);
  });
});
