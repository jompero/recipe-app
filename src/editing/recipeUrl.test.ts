import { sameRecipeUrl } from "./recipeUrl.ts";

test.each([
  ["the same URL", "https://www.example.com/pancakes/", "https://www.example.com/pancakes/"],
  ["http vs https", "http://example.com/pancakes", "https://example.com/pancakes"],
  ["with and without www.", "https://www.example.com/pancakes", "https://example.com/pancakes"],
  ["a query", "https://example.com/pancakes?utm_source=x", "https://example.com/pancakes"],
  ["a fragment", "https://example.com/pancakes#recipe", "https://example.com/pancakes"],
  ["a trailing slash", "https://example.com/pancakes/", "https://example.com/pancakes"],
  ["host case", "https://Example.COM/pancakes", "https://example.com/pancakes"],
  ["a typed URL with no protocol", "www.example.com/pancakes", "https://example.com/pancakes/"],
  ["spaces around it", "  https://example.com/pancakes  ", "https://example.com/pancakes"],
  ["only the host", "https://www.example.com/", "example.com"],
])("matches ignoring %s", (_, a, b) => {
  expect(sameRecipeUrl(a, b)).toBe(true);
});

test.each([
  ["a different path", "https://example.com/pancakes", "https://example.com/waffles"],
  ["a different host", "https://example.com/pancakes", "https://example.org/pancakes"],
  ["a subdomain other than www", "https://cooking.example.com/x", "https://example.com/x"],
  ["path case", "https://example.com/Pancakes", "https://example.com/pancakes"],
  ["a different port", "https://example.com:8443/x", "https://example.com/x"],
])("doesn't match %s", (_, a, b) => {
  expect(sameRecipeUrl(a, b)).toBe(false);
});

test.each([
  ["both empty", "", ""],
  ["spaces only", "  ", "  "],
  ["not a URL", "not a url at all", "not a url at all"],
  ["not http(s)", "mailto:ada@example.com", "mailto:ada@example.com"],
])("never matches %s", (_, a, b) => {
  expect(sameRecipeUrl(a, b)).toBe(false);
});
