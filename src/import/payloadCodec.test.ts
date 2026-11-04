import { decodePayload, encodePayload, InvalidPayloadError } from "./payloadCodec.ts";
import type { RecipePayload } from "./recipePayload.ts";

const payload: RecipePayload = {
  v: 1,
  url: "https://madensverden.dk/nem-boller-i-karry-opskrift/",
  recipe: {
    name: "Æblekage med flødeskum (ÆØÅ æøå)",
    recipeIngredient: ["1,5 dl mælk", "2 spsk. smør"],
    description: "Mämmi ja pääsiäinen: äö ÄÖ, plus “quotes”, € and 🍰",
  },
};

/** Standard base64 of some bytes, independent of the code under test. */
function base64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
}

/** Encodes text the way the bookmarklet will: UTF-8, base64url, no padding. */
function encodeText(text: string): string {
  return base64(new TextEncoder().encode(text))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("encodePayload / decodePayload", () => {
  it("round-trips non-ASCII text", () => {
    expect(decodePayload(encodePayload(payload))).toEqual(payload);
  });

  it("writes plain base64url with no padding", () => {
    const encoded = encodePayload(payload);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).toBe(encodeText(JSON.stringify(payload)));
  });

  it("also reads standard base64 with padding", () => {
    const json = JSON.stringify(payload);
    expect(decodePayload(encodeText(json))).toEqual(payload);
    expect(decodePayload(base64(new TextEncoder().encode(json)))).toEqual(payload);
  });

  it.each([
    ["an empty string", ""],
    ["characters outside base64url", "not base64!"],
    ["an impossible length", "abcde"],
    ["text that isn't JSON", encodeText("hello")],
    ["invalid UTF-8", base64(new Uint8Array([0xff, 0xfe, 0xfd]))],
    ["JSON that isn't an object", encodeText("[1]")],
    ["a missing url", encodeText(JSON.stringify({ v: 1, recipe: {} }))],
    ["a missing recipe", encodeText(JSON.stringify({ v: 1, url: "https://a.example/" }))],
    ["a recipe that isn't an object", encodeText(JSON.stringify({ v: 1, url: "x", recipe: [] }))],
  ])("throws on %s", (_label, encoded) => {
    expect(() => decodePayload(encoded)).toThrow(InvalidPayloadError);
  });

  it.each([[2], [0], ["1"], [undefined]])("throws on version %j", (v) => {
    const encoded = encodeText(JSON.stringify({ ...payload, v }));
    expect(() => decodePayload(encoded)).toThrow(/version/i);
  });
});
