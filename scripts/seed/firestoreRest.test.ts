import { describe, expect, it } from "vitest";
import { toFirestoreFields } from "./firestoreRest.ts";

describe("toFirestoreFields", () => {
  it("converts each JSON type to its Firestore REST value", () => {
    expect(
      toFirestoreFields({
        title: "Pasta",
        qty: 400,
        half: 0.5,
        archived: false,
        thumbnail: null,
      }),
    ).toEqual({
      title: { stringValue: "Pasta" },
      qty: { integerValue: "400" },
      half: { doubleValue: 0.5 },
      archived: { booleanValue: false },
      thumbnail: { nullValue: null },
    });
  });

  it("converts nested lists and maps", () => {
    expect(
      toFirestoreFields({
        tags: ["pasta"],
        ingredients: [{ header: "Sauce" }, { raw: "1 dl cream", qty: 1 }],
        empty: [],
      }),
    ).toEqual({
      tags: { arrayValue: { values: [{ stringValue: "pasta" }] } },
      ingredients: {
        arrayValue: {
          values: [
            { mapValue: { fields: { header: { stringValue: "Sauce" } } } },
            {
              mapValue: {
                fields: { raw: { stringValue: "1 dl cream" }, qty: { integerValue: "1" } },
              },
            },
          ],
        },
      },
      empty: { arrayValue: { values: [] } },
    });
  });

  it("writes the named fields as timestamps", () => {
    expect(
      toFirestoreFields(
        { createdAt: "2026-11-03T19:00:00.000Z", note: "2026-11-03T19:00:00.000Z" },
        ["createdAt"],
      ),
    ).toEqual({
      createdAt: { timestampValue: "2026-11-03T19:00:00.000Z" },
      note: { stringValue: "2026-11-03T19:00:00.000Z" },
    });
  });
});
