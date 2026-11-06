// Emulator test for src/data/groceries.ts (US-6.3), with the real firestore.rules loaded.
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { initializeApp } from "firebase/app";
import {
  arrayUnion,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  terminate,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import firestoreRules from "../../firestore.rules?raw";
import { db } from "../config/firebase";
import type { SourceLine } from "../groceries/types.ts";
import {
  addHandLine,
  addLines,
  clearList,
  HAND_LINE_MAX,
  removeLines,
  replaceList,
  tick,
  untick,
  watchGroceryList,
  type GroceryList,
} from "./groceries";

const { PROJECT_ID, MEMBER, HOST, PORT, TOKEN } = vi.hoisted(() => {
  const [host = "127.0.0.1", port = "8080"] = (
    (import.meta.env["FIRESTORE_EMULATOR_HOST"] as string | undefined) ?? "127.0.0.1:8080"
  ).split(":");
  const member = "member@example.com";
  return {
    // Its own project, so clearing data never touches the dev data or the other tests.
    PROJECT_ID: "demo-recipe-app-groceries-test",
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
  const app = initializeApp({ projectId: PROJECT_ID }, "groceries-emulator-test");
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
  otherDevice = getFirestore(initializeApp({ projectId: PROJECT_ID }, "groceries-other-device"));
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

/** The list as the server has it, not from this client's cache. */
async function readList(): Promise<{ lines: SourceLine[]; ticked: string[] } | null> {
  const snapshot = await getDocFromServer(doc(db, "grocery_lists/current"));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { lines: data["lines"] as SourceLine[], ticked: (data["ticked"] as string[]) ?? [] };
}

/** Resolves with the first update from watchGroceryList that passes `check`. */
function nextList(check: (list: GroceryList) => boolean) {
  return new Promise<GroceryList>((resolve, reject) => {
    const stop = watchGroceryList((list) => {
      if (!check(list)) return;
      stop();
      resolve(list);
    }, reject);
  });
}

const pasta = (raw: string) => ({
  raw,
  scale: 2,
  recipeId: "pasta",
  title: "Pasta",
  entryId: "e1",
});
const soup = (raw: string) => ({ raw, scale: 1, recipeId: "soup", title: "Soup", entryId: "e2" });
const withoutIds = (lines: SourceLine[] | undefined) =>
  lines?.map((line) => Object.fromEntries(Object.entries(line).filter(([key]) => key !== "id")));

describe("grocery list data module", () => {
  test("with no list saved, the list is empty", async () => {
    const list = await nextList(() => true);
    expect(list).toEqual({ lines: [], ticked: [], updatedAt: null });
  });

  test("replacing writes new lines with their own IDs and clears the ticks", async () => {
    const [old] = await replaceList([pasta("1 dl milk")]);
    await tick([old!.id]);

    const saved = await replaceList([pasta("400 g pasta"), soup("1 onion")]);

    expect(new Set(saved.map((line) => line.id)).size).toBe(2);
    expect(await readList()).toEqual({ lines: saved, ticked: [] });
    expect(withoutIds(saved)).toEqual([pasta("400 g pasta"), soup("1 onion")]);
  });

  test("adding puts lines after the ones already there, and keeps the ticks", async () => {
    const [milk] = await replaceList([pasta("1 dl milk")]);
    await tick([milk!.id]);

    const added = await addLines([soup("1 onion")]);

    expect(await readList()).toEqual({ lines: [milk, ...added], ticked: [milk!.id] });
  });

  test("adding to no list creates it", async () => {
    const added = await addLines([soup("1 onion")]);
    expect(await readList()).toEqual({ lines: added, ticked: [] });
  });

  test("ticks from two devices at once both survive", async () => {
    const [milk, onion] = await replaceList([pasta("1 dl milk"), soup("1 onion")]);
    const ref = doc(otherDevice, "grocery_lists/current");

    await Promise.all([
      tick([milk!.id]),
      updateDoc(ref, { ticked: arrayUnion(onion!.id), updatedAt: serverTimestamp() }),
    ]);

    expect((await readList())?.ticked.sort()).toEqual([milk!.id, onion!.id].sort());
  });

  test("ticking and unticking several lines at once (a merged line)", async () => {
    const [a, b, c] = await replaceList([pasta("1 dl milk"), soup("2 dl milk"), soup("1 onion")]);
    await tick([a!.id, b!.id, c!.id]);

    await untick([a!.id, b!.id]);

    expect((await readList())?.ticked).toEqual([c!.id]);
  });

  test("a line added by hand is trimmed, at 1×, with no recipe", async () => {
    await replaceList([pasta("1 dl milk")]);

    const line = await addHandLine("  toilet paper ");

    expect(line).toEqual({ id: line.id, raw: "toilet paper", scale: 1 });
    expect((await readList())?.lines.at(-1)).toEqual(line);
  });

  test.each([
    ["empty", "   "],
    ["too long", "x".repeat(HAND_LINE_MAX + 1)],
  ])("an %s hand-added line is refused before anything is written", async (_, raw) => {
    await expect(addHandLine(raw)).rejects.toThrow();
    expect(await readList()).toBeNull();
  });

  test("removing lines takes their ticks too, and leaves the rest", async () => {
    const lines = await replaceList([pasta("1 dl milk"), pasta("400 g pasta"), soup("1 onion")]);
    await tick(lines.map((line) => line.id));

    await removeLines(lines.slice(0, 2));

    expect(await readList()).toEqual({ lines: [lines[2]], ticked: [lines[2]!.id] });
  });

  test("clearing empties the list", async () => {
    const [milk] = await replaceList([pasta("1 dl milk")]);
    await tick([milk!.id]);

    await clearList();

    expect(await readList()).toEqual({ lines: [], ticked: [] });
  });

  test("watching sees another device's tick, with when the list last changed", async () => {
    const [milk] = await replaceList([pasta("1 dl milk")]);
    const seen = nextList((list) => list.ticked.includes(milk!.id));

    await updateDoc(doc(otherDevice, "grocery_lists/current"), {
      ticked: arrayUnion(milk!.id),
      updatedAt: serverTimestamp(),
    });

    const list = await seen;
    expect(list.lines).toEqual([milk]);
    expect(list.updatedAt).toBeInstanceOf(Date);
  });

  test("malformed lines are skipped when reading", async () => {
    await env.withSecurityRulesDisabled(async (admin) => {
      await admin
        .firestore()
        .doc("grocery_lists/current")
        .set({
          lines: [
            { id: "a", raw: "1 dl milk", scale: 1 },
            { raw: "no id", scale: 1 },
            { id: "b", raw: "no scale" },
            { id: "c", raw: "bad title", scale: 1, title: 7 },
            "text",
            null,
          ],
          ticked: ["a", 5],
        });
    });

    const list = await nextList((l) => l.lines[0]?.id === "a");
    expect(list).toEqual({
      lines: [{ id: "a", raw: "1 dl milk", scale: 1 }],
      ticked: ["a"],
      updatedAt: null,
    });
  });
});
