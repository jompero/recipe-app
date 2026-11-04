// The `#/import?d=` data (EPIC-4, US-4.3): a RecipePayload as UTF-8 JSON in base64url with no
// padding. The bookmarklet (src/bookmarklet/) has its own tiny encoder, because it must stand
// alone; both use this plain format, so they agree.
import type { RecipePayload } from "./recipePayload.ts";

/** The import data couldn't be read: not base64, not JSON, not a payload, or the wrong version. */
export class InvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPayloadError";
  }
}

export function encodePayload(payload: RecipePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Reads import data. Also accepts standard base64 and padding. Throws InvalidPayloadError. */
export function decodePayload(d: string): RecipePayload {
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(d)) {
    throw new InvalidPayloadError("The recipe data is empty or isn't base64url.");
  }

  let bytes: Uint8Array;
  try {
    const binary = atob(d.replace(/-/g, "+").replace(/_/g, "/"));
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new InvalidPayloadError("The recipe data isn't valid base64url.");
  }

  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new InvalidPayloadError("The recipe data isn't UTF-8 JSON.");
  }

  if (!isObject(data)) throw new InvalidPayloadError("The recipe data isn't an object.");
  if (data.v !== 1) {
    throw new InvalidPayloadError(
      `Unsupported recipe data version ${JSON.stringify(data.v)}; expected 1.`,
    );
  }
  if (typeof data.url !== "string") throw new InvalidPayloadError("The recipe data has no url.");
  if (!isObject(data.recipe)) throw new InvalidPayloadError("The recipe data has no recipe.");
  return data as unknown as RecipePayload;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
