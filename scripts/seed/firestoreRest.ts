// Converts plain JSON documents (as in the export file) to the typed values Firestore's REST API
// expects: https://firebase.google.com/docs/firestore/reference/rest/v1/Value

type RestValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values: RestValue[] } }
  | { mapValue: { fields: Record<string, RestValue> } };

function toValue(value: unknown): RestValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    // Like the web SDK: whole numbers are stored as integers, everything else as doubles.
    return Number.isSafeInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === "object") {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }
  throw new Error(`Can't store a ${typeof value} in Firestore.`);
}

/** A document's fields as REST values; the named top-level fields hold ISO dates → timestamps. */
export function toFirestoreFields(
  document: Record<string, unknown>,
  timestampFields: readonly string[] = [],
): Record<string, RestValue> {
  const fields: Record<string, RestValue> = {};
  for (const [name, value] of Object.entries(document)) {
    fields[name] =
      timestampFields.includes(name) && typeof value === "string"
        ? { timestampValue: value }
        : toValue(value);
  }
  return fields;
}
