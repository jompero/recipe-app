import { AISLES, aisleOf, groupByAisle } from "./aisles.ts";
import { mergeKey } from "./mergeKey.ts";
import { mergeLines } from "./mergeLines.ts";
import type { SourceLine } from "./types.ts";

const aisle = (item: string) => aisleOf(mergeKey(item));

test("the aisles walk the shop in a fixed order, Other last", () => {
  expect(AISLES).toEqual([
    "Produce",
    "Bakery",
    "Dairy",
    "Meat & fish",
    "Dry goods",
    "Frozen",
    "Other",
  ]);
});

describe("aisleOf", () => {
  test("plurals and synonyms reach the same aisle", () => {
    expect(aisle("Onions")).toBe("Produce");
    expect(aisle("onion")).toBe("Produce");
    expect(aisle("sipuli")).toBe("Produce");
    expect(aisle("æg")).toBe("Dairy");
    expect(aisle("eggs")).toBe("Dairy");
    expect(aisle("plain flour")).toBe("Dry goods");
    expect(aisle("2 cloves garlic")).toBe(aisle("garlic"));
  });

  test("a phrase beats a word in it", () => {
    expect(aisle("milk")).toBe("Dairy");
    expect(aisle("coconut milk")).toBe("Dry goods");
    expect(aisle("tomatoes")).toBe("Produce");
    expect(aisle("tin chopped tomatoes")).toBe("Dry goods");
    expect(aisle("red pepper")).toBe("Produce");
    expect(aisle("crushed red pepper flakes")).toBe("Dry goods");
  });

  test("prep words around the thing to buy don't matter", () => {
    expect(aisle("finely chopped onion")).toBe("Produce");
    expect(aisle("parmesan cheese shredded")).toBe("Dairy");
    expect(aisle("sweet potatoes chopped")).toBe("Produce");
    expect(aisle("olive oil for frying")).toBe("Dry goods");
  });

  test("frozen and dried things go to their aisles", () => {
    expect(aisle("frozen spinach")).toBe("Frozen");
    expect(aisle("spinach")).toBe("Produce");
    expect(aisle("dried thyme")).toBe("Dry goods");
    expect(aisle("thyme")).toBe("Produce");
  });

  test("meat and fish, bakery", () => {
    expect(aisle("boneless skinless chicken breasts")).toBe("Meat & fish");
    expect(aisle("cod fillet")).toBe("Meat & fish");
    expect(aisle("rye bread")).toBe("Bakery");
    expect(aisle("tortillas")).toBe("Bakery");
  });

  test("anything the table doesn't know goes to Other", () => {
    expect(aisle("water")).toBe("Other");
    expect(aisle("for serving")).toBe("Other");
    expect(aisle("")).toBe("Other");
  });
});

test("groupByAisle keeps the aisles' order and A–Z within, and leaves out empty aisles", () => {
  const sources: SourceLine[] = ["Water", "2 dl milk", "Carrots", "Apples", "Butter"].map(
    (raw, i) => ({ id: String(i), raw, scale: 1 }),
  );
  const groups = groupByAisle(mergeLines(sources)).map(
    (group) => `${group.aisle}: ${group.lines.map((line) => line.name).join(", ")}`,
  );
  expect(groups).toEqual(["Produce: Apples, Carrots", "Dairy: Butter, milk", "Other: Water"]);
});
