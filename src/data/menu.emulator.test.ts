// Emulator test for src/data/menu.ts (US-5.1), with the real firestore.rules loaded.
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { initializeApp } from "firebase/app";
import {
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  doc,
  documentId,
  getDocsFromServer,
  getFirestore,
  query,
  where,
  serverTimestamp,
  setDoc,
  terminate,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import firestoreRules from "../../firestore.rules?raw";
import { NOTE_MAX } from "../plan/note.ts";
import { db } from "../config/firebase";
import {
  addEntry,
  moveEntry,
  removeEntry,
  saveRoll,
  watchDays,
  type MenuEntry,
  type PlanDays,
} from "./menu";

const { PROJECT_ID, MEMBER, HOST, PORT, TOKEN } = vi.hoisted(() => {
  const [host = "127.0.0.1", port = "8080"] = (
    (import.meta.env["FIRESTORE_EMULATOR_HOST"] as string | undefined) ?? "127.0.0.1:8080"
  ).split(":");
  const member = "member@example.com";
  return {
    // Its own project, so clearing data never touches the dev data or the other tests.
    PROJECT_ID: "demo-recipe-app-menu-test",
    MEMBER: member,
    HOST: host,
    PORT: Number(port),
    TOKEN: { sub: "member", email: member, email_verified: true },
  };
});

// The app's Firestore, swapped for one on the emulator that is signed in as an allowed member.
vi.mock("../config/firebase", async () => {
  const { initializeApp } = await import("firebase/app");
  const { connectFirestoreEmulator, getFirestore } = await import("firebase/firestore");
  const app = initializeApp({ projectId: PROJECT_ID }, "menu-emulator-test");
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, PORT, { mockUserToken: TOKEN });
  return { db };
});

let env: RulesTestEnvironment;
/** Another member's device: a second, separate Firestore client. */
let otherDevice: Firestore;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: HOST, port: PORT, rules: firestoreRules },
  });
  otherDevice = getFirestore(initializeApp({ projectId: PROJECT_ID }, "menu-other-device"));
  connectFirestoreEmulator(otherDevice, HOST, PORT, { mockUserToken: TOKEN });
});

afterAll(async () => {
  await terminate(otherDevice);
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (admin) => {
    await admin.firestore().doc(`allowed_users/${MEMBER}`).set({});
  });
});

/**
 * The Plan days in a range as the server has them. Not through watchDays: its first answer can come
 * from this client's cache, which still holds days from earlier tests after clearFirestore.
 */
async function readDays(first: string, last: string): Promise<PlanDays> {
  const snapshot = await getDocsFromServer(
    query(
      collection(db, "menu_days"),
      where(documentId(), ">=", first),
      where(documentId(), "<=", last),
    ),
  );
  const days: PlanDays = {};
  for (const day of snapshot.docs) days[day.id] = day.data()["entries"] as MenuEntry[];
  return days;
}

/** Resolves with the first update from watchDays that passes `check`. */
function nextDays(first: string, last: string, check: (days: PlanDays) => boolean) {
  return new Promise<PlanDays>((resolve, reject) => {
    const stop = watchDays(
      first,
      last,
      (days) => {
        if (!check(days)) return;
        stop();
        resolve(days);
      },
      reject,
    );
  });
}

const withoutIds = (entries: MenuEntry[] | undefined) =>
  entries?.map((entry) => ("note" in entry ? { note: entry.note } : { recipeId: entry.recipeId }));

describe("menu data module", () => {
  test("adding creates the day; entries keep the order they were added", async () => {
    const pasta = await addEntry("2026-11-04", { recipeId: "pasta" });
    await addEntry("2026-11-04", { note: "  Leftovers  " });

    const days = await readDays("2026-11-02", "2026-11-08");
    expect(Object.keys(days)).toEqual(["2026-11-04"]);
    expect(withoutIds(days["2026-11-04"])).toEqual([{ recipeId: "pasta" }, { note: "Leftovers" }]);
    expect(days["2026-11-04"]?.[0]).toEqual(pasta);
  });

  test("the same recipe can be on a day twice, and removing takes away only one", async () => {
    const first = await addEntry("2026-11-04", { recipeId: "pasta" });
    const second = await addEntry("2026-11-04", { recipeId: "pasta" });
    expect(first.id).not.toBe(second.id);

    await removeEntry("2026-11-04", first);

    expect((await readDays("2026-11-04", "2026-11-04"))["2026-11-04"]).toEqual([second]);
  });

  test("adds from two devices to the same day both survive", async () => {
    await Promise.all([
      addEntry("2026-11-04", { recipeId: "pasta" }),
      setDoc(
        doc(otherDevice, "menu_days/2026-11-04"),
        { entries: arrayUnion({ id: "other", note: "Pizza" }), updatedAt: serverTimestamp() },
        { merge: true },
      ),
    ]);

    const entries = (await readDays("2026-11-04", "2026-11-04"))["2026-11-04"];
    expect(withoutIds(entries)).toHaveLength(2);
    expect(withoutIds(entries)).toEqual(
      expect.arrayContaining([{ recipeId: "pasta" }, { note: "Pizza" }]),
    );
  });

  test("removing the last entry leaves an empty day", async () => {
    const entry = await addEntry("2026-11-04", { note: "Eating out" });

    await removeEntry("2026-11-04", entry);

    expect(await readDays("2026-11-04", "2026-11-04")).toEqual({ "2026-11-04": [] });
  });

  test("moving an entry takes it off one day and puts it at the end of another, same ID", async () => {
    const soup = await addEntry("2026-11-04", { recipeId: "soup" });
    await addEntry("2026-11-06", { note: "Guests" });

    await moveEntry("2026-11-04", "2026-11-06", soup);

    const days = await readDays("2026-11-02", "2026-11-08");
    expect(days["2026-11-04"]).toEqual([]);
    expect(days["2026-11-06"]?.[1]).toEqual(soup);
  });

  test("moving to a day that doesn't exist yet creates it", async () => {
    const soup = await addEntry("2026-11-04", { recipeId: "soup" });

    await moveEntry("2026-11-04", "2026-11-20", soup);

    expect((await readDays("2026-11-20", "2026-11-20"))["2026-11-20"]).toEqual([soup]);
  });

  test("the range includes both ends and nothing outside them", async () => {
    for (const date of ["2026-11-01", "2026-11-02", "2026-11-08", "2026-11-09"]) {
      await addEntry(date, { note: date });
    }

    expect(Object.keys(await readDays("2026-11-02", "2026-11-08")).sort()).toEqual([
      "2026-11-02",
      "2026-11-08",
    ]);
  });

  test("watching a range sees another device's add", async () => {
    const seen = nextDays("2026-11-02", "2026-11-08", (days) => "2026-11-05" in days);

    await setDoc(
      doc(otherDevice, "menu_days/2026-11-05"),
      { entries: arrayUnion({ id: "other", note: "Tacos" }), updatedAt: serverTimestamp() },
      { merge: true },
    );

    expect((await seen)["2026-11-05"]).toEqual([{ id: "other", note: "Tacos" }]);
  });

  test("malformed entries are skipped when reading", async () => {
    await env.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .doc("menu_days/2026-11-04")
        .set({ entries: [{ id: "a", recipeId: "pasta" }, { recipeId: "no-id" }, "text", null] });
    });

    const days = await nextDays(
      "2026-11-04",
      "2026-11-04",
      (d) => d["2026-11-04"]?.[0]?.id === "a",
    );
    expect(days).toEqual({ "2026-11-04": [{ id: "a", recipeId: "pasta" }] });
  });

  test.each([
    ["empty", "   "],
    ["too long", "x".repeat(NOTE_MAX + 1)],
  ])("an %s note is refused before anything is written", async (_, note) => {
    await expect(addEntry("2026-11-04", { note })).rejects.toThrow();
    expect(await readDays("2026-11-04", "2026-11-04")).toEqual({});
  });

  test("saving a roll adds to several days in one batch, after any entries already there", async () => {
    const existing = await addEntry("2026-11-04", { note: "Guests" });

    const saved = await saveRoll([
      { date: "2026-11-03", recipeId: "pasta" },
      { date: "2026-11-04", recipeId: "soup" },
    ]);

    const days = await readDays("2026-11-02", "2026-11-08");
    expect(withoutIds(days["2026-11-03"])).toEqual([{ recipeId: "pasta" }]);
    expect(days["2026-11-04"]).toEqual([existing, saved[1]?.entry]);
  });
});
