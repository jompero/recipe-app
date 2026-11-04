// Security rules tests (US-1.3). Run against the Firestore emulator:
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";

const MEMBER = "member@example.com";
const UNVERIFIED_MEMBER = "unverified@example.com";
const STRANGER = "stranger@example.com";

let env: RulesTestEnvironment;

beforeAll(async () => {
  // emulators:exec sets FIRESTORE_EMULATOR_HOST; otherwise assume `npm run emulators` defaults.
  const [host = "127.0.0.1", port = "8080"] = (
    process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8080"
  ).split(":");
  env = await initializeTestEnvironment({
    // Its own project, so clearing data between tests never touches the dev data in demo-recipe-app.
    projectId: "demo-recipe-app-rules-test",
    firestore: {
      host,
      port: Number(port),
      rules: readFileSync(path.resolve(import.meta.dirname, "../../firestore.rules"), "utf8"),
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (admin) => {
    const db = admin.firestore();
    await db.doc(`allowed_users/${MEMBER}`).set({});
    await db.doc(`allowed_users/${UNVERIFIED_MEMBER}`).set({});
    await db.doc("recipes/r1").set({ title: "Existing" });
    await db.doc("recipe_images/r1").set({ data: "data:image/jpeg;base64,AAAA" });
    await db.doc("menu_days/2026-11-03").set({ entries: [] });
    await db.doc("secrets/s1").set({ value: "x" });
  });
});

type Who = "signed out" | "non-member" | "unverified member" | "member";

function as(who: Who): RulesTestContext {
  switch (who) {
    case "signed out":
      return env.unauthenticatedContext();
    case "non-member":
      return env.authenticatedContext("stranger", { email: STRANGER, email_verified: true });
    case "unverified member":
      return env.authenticatedContext("unverified", {
        email: UNVERIFIED_MEMBER,
        email_verified: false,
      });
    case "member":
      return env.authenticatedContext("member", { email: MEMBER, email_verified: true });
  }
}

/** A recipe document with every field the rules require (US-2.4). */
function validRecipe(): Record<string, unknown> {
  return {
    title: "Pasta",
    description: "",
    source: "",
    sourceUrl: "",
    yield: "",
    activeTime: "",
    totalTime: "",
    tags: ["pasta"],
    ingredients: [{ raw: "400 g pasta", qty: 400, unit: "g", item: "pasta" }],
    instructions: [{ text: "Boil." }],
    thumbnail: "data:image/jpeg;base64,AAAA",
    hasImage: true,
    archived: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

// Recipes are archived, never deleted (Epic 2/3). A recipe's image is deleted when its photo is
// removed (US-4.1). Menu days may be deleted.
const SAMPLE_DOCS = {
  recipes: { existing: "recipes/r1", data: validRecipe(), memberCanDelete: false },
  recipe_images: {
    existing: "recipe_images/r1",
    data: { data: "data:image/jpeg;base64,BBBB" },
    memberCanDelete: true,
  },
  menu_days: {
    existing: "menu_days/2026-11-03",
    data: { entries: [{ recipeId: "r1" }] },
    memberCanDelete: true,
  },
} as const;

const NOT_ALLOWED: Who[] = ["signed out", "non-member", "unverified member"];

describe.each(Object.entries(SAMPLE_DOCS))("%s", (collection, sample) => {
  const { existing, data, memberCanDelete } = sample;
  describe.each(NOT_ALLOWED)("%s", (who) => {
    test("can't get a document", async () => {
      await assertFails(as(who).firestore().doc(existing).get());
    });
    test("can't list the collection", async () => {
      await assertFails(as(who).firestore().collection(collection).get());
    });
    test("can't create a document", async () => {
      await assertFails(as(who).firestore().doc(`${collection}/new`).set(data));
    });
    test("can't update a document", async () => {
      await assertFails(as(who).firestore().doc(existing).set(data));
    });
    test("can't delete a document", async () => {
      await assertFails(as(who).firestore().doc(existing).delete());
    });
  });

  describe("member", () => {
    test("can get a document", async () => {
      await assertSucceeds(as("member").firestore().doc(existing).get());
    });
    test("can list the collection", async () => {
      await assertSucceeds(as("member").firestore().collection(collection).get());
    });
    test("can create a document", async () => {
      await assertSucceeds(as("member").firestore().doc(`${collection}/new`).set(data));
    });
    test("can update a document", async () => {
      await assertSucceeds(as("member").firestore().doc(existing).set(data));
    });
    test(`${memberCanDelete ? "can" : "can't"} delete a document`, async () => {
      const deletion = as("member").firestore().doc(existing).delete();
      await (memberCanDelete ? assertSucceeds(deletion) : assertFails(deletion));
    });
  });
});

describe("recipe shape (US-2.4)", () => {
  const write = (data: Record<string, unknown>) =>
    setDoc(doc(as("member").firestore(), "recipes/new"), data);

  test("a recipe with a null thumbnail and no image is valid", async () => {
    await assertSucceeds(write({ ...validRecipe(), thumbnail: null, hasImage: false }));
  });

  test("server timestamps are valid dates", async () => {
    await assertSucceeds(
      write({ ...validRecipe(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    );
  });

  test("a thumbnail of 60,000 characters is allowed", async () => {
    await assertSucceeds(write({ ...validRecipe(), thumbnail: "A".repeat(60_000) }));
  });

  test("an update that changes only some fields is checked against the whole document", async () => {
    await assertSucceeds(write(validRecipe()));
    const recipe = doc(as("member").firestore(), "recipes/new");
    await assertSucceeds(updateDoc(recipe, { archived: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(recipe, { archived: "yes" }));
  });

  test.each([
    ["an unknown field", { notes: "x" }],
    ["an empty title", { title: "" }],
    ["a title that isn't a string", { title: 42 }],
    ["a description that isn't a string", { description: null }],
    ["a sourceUrl that isn't a string", { sourceUrl: 1 }],
    ["tags that aren't a list", { tags: "pasta" }],
    ["ingredients that aren't a list", { ingredients: "400 g pasta" }],
    ["instructions that aren't a list", { instructions: { text: "Boil." } }],
    ["archived that isn't true/false", { archived: "no" }],
    ["hasImage that isn't true/false", { hasImage: 1 }],
    ["a thumbnail that isn't a string or null", { thumbnail: 5 }],
    ["a thumbnail over 60,000 characters", { thumbnail: "A".repeat(60_001) }],
    ["a createdAt that isn't a timestamp", { createdAt: "2026-11-03" }],
    ["an updatedAt that isn't a timestamp", { updatedAt: 0 }],
  ])("rejects %s", async (_, change) => {
    await assertFails(write({ ...validRecipe(), ...change }));
  });

  test.each(["title", "ingredients", "archived", "createdAt"])(
    "rejects a recipe without %s",
    async (field) => {
      const recipe = validRecipe();
      delete recipe[field];
      await assertFails(write(recipe));
    },
  );
});

describe("recipe image shape (US-2.4)", () => {
  const write = (data: Record<string, unknown>) =>
    setDoc(doc(as("member").firestore(), "recipe_images/new"), data);

  test("an image of 900,000 characters is allowed", async () => {
    await assertSucceeds(write({ data: "A".repeat(900_000) }));
  });

  test.each([
    ["an image over 900,000 characters", { data: "A".repeat(900_001) }],
    ["data that isn't a string", { data: 1 }],
    ["no data", {}],
    ["an unknown field", { data: "data:image/jpeg;base64,AAAA", recipeId: "r1" }],
  ])("rejects %s", async (_, data) => {
    await assertFails(write(data));
  });
});

describe("allowed_users", () => {
  test("a member can read their own entry", async () => {
    await assertSucceeds(as("member").firestore().doc(`allowed_users/${MEMBER}`).get());
  });
  test("a non-member can check their own (missing) entry", async () => {
    // The app relies on this to show "not on the list" instead of a permission error.
    const snapshot = await assertSucceeds(
      as("non-member").firestore().doc(`allowed_users/${STRANGER}`).get(),
    );
    if (snapshot.exists) throw new Error("expected no allowlist entry for the stranger");
  });
  test("a member can't read someone else's entry", async () => {
    await assertFails(as("member").firestore().doc(`allowed_users/${UNVERIFIED_MEMBER}`).get());
  });
  test("signed out can't read any entry", async () => {
    await assertFails(as("signed out").firestore().doc(`allowed_users/${MEMBER}`).get());
  });
  test("a member can't list the allowlist", async () => {
    await assertFails(as("member").firestore().collection("allowed_users").get());
  });
  test("a non-member can't add themselves", async () => {
    await assertFails(as("non-member").firestore().doc(`allowed_users/${STRANGER}`).set({}));
  });
  test("a member can't add someone else", async () => {
    await assertFails(as("member").firestore().doc(`allowed_users/${STRANGER}`).set({}));
  });
  test("a member can't change their own entry", async () => {
    await assertFails(as("member").firestore().doc(`allowed_users/${MEMBER}`).set({ x: 1 }));
  });
  test("a member can't delete their own entry", async () => {
    await assertFails(as("member").firestore().doc(`allowed_users/${MEMBER}`).delete());
  });
});

describe("a collection with no rule", () => {
  test.each(["signed out", "non-member", "member"] as Who[])("%s can't read it", async (who) => {
    await assertFails(as(who).firestore().doc("secrets/s1").get());
  });
  test.each(["signed out", "non-member", "member"] as Who[])("%s can't write it", async (who) => {
    await assertFails(as(who).firestore().doc("secrets/s2").set({ value: "y" }));
  });
});
