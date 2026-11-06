// Seeding documents for end-to-end tests, through the Firestore emulator's REST API as the owner
// (which skips the rules, like makeMember in members.ts).

const PROJECT_ID = "demo-recipe-app";
const FIRESTORE = `http://${process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8080"}`;

type Value =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { timestampValue: string }
  | { arrayValue: { values: Value[] } }
  | { mapValue: { fields: Record<string, Value> } };

/** A plain value in the REST API's typed form. */
function toValue(value: unknown): Value {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === "object") return { mapValue: { fields: toFields(value) } };
  throw new Error(`Can't seed a ${typeof value}`);
}

function toFields(data: object): Record<string, Value> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)]));
}

/** Writes (or replaces) a document at `path`, e.g. "recipes/pancakes". */
export async function putDoc(path: string, data: Record<string, unknown>): Promise<void> {
  const url = `${FIRESTORE}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!response.ok) throw new Error(`Couldn't seed ${path}: ${await response.text()}`);
}

/** A recipe with every field the app and the rules expect. */
export function recipe(title: string, ingredients: string[]): Record<string, unknown> {
  const now = new Date();
  return {
    title,
    description: "",
    source: "",
    sourceUrl: "",
    yield: "",
    activeTime: "",
    totalTime: "",
    tags: [],
    ingredients: ingredients.map((raw) => ({ raw })),
    instructions: [],
    thumbnail: null,
    hasImage: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Today's date key ("2026-11-06") in the browser's (and this machine's) time zone. */
export function todayKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
