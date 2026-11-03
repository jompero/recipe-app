import assert from "node:assert/strict";
import { test } from "vitest";
import { imageFileName, isJpeg, parseImageUrl, summarise } from "./lib.ts";

const recipe = (imageLine: string) =>
  ["Title: Pasta", "Yield: ", imageLine, "Ingredients:", "\t400 g Pasta"].join("\r\n");

test("parseImageUrl reads the URL from the Image line (CRLF file)", () => {
  assert.equal(
    parseImageUrl(recipe("Image: https://cdn2.pepperplate.com/recipes/abc.jpg")),
    "https://cdn2.pepperplate.com/recipes/abc.jpg",
  );
});

test("parseImageUrl returns null for an empty Image line", () => {
  assert.equal(parseImageUrl(recipe("Image: ")), null);
});

test("parseImageUrl returns null when there is no Image line", () => {
  assert.equal(parseImageUrl("Title: Pasta\nIngredients:\n"), null);
});

test("parseImageUrl ignores 'Image:' text that isn't at the start of a line", () => {
  assert.equal(parseImageUrl("Description: see Image: http://x.example/a.jpg\n"), null);
});

test("imageFileName swaps .txt for .jpg", () => {
  assert.equal(
    imageFileName("15MinPulledOatsMushroomPasta.txt"),
    "15MinPulledOatsMushroomPasta.jpg",
  );
});

test("isJpeg checks the magic bytes", () => {
  assert.equal(isJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), true);
  assert.equal(isJpeg(new TextEncoder().encode("<html>")), false);
  assert.equal(isJpeg(new Uint8Array([0xff, 0xd8])), false);
});

test("summarise counts each status", () => {
  const counts = summarise([
    { recipeFile: "a.txt", url: "u", savedFile: "a.jpg", status: "saved" },
    { recipeFile: "b.txt", url: null, savedFile: null, status: "no-image" },
    { recipeFile: "c.txt", url: "u", savedFile: null, status: "failed", reason: "HTTP 404" },
  ]);
  assert.deepEqual(counts, { saved: 1, "skipped-existing": 0, "no-image": 1, failed: 1 });
});
