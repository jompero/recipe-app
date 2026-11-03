// Emulator test for src/data/images.ts (US-2.3), with the real firestore.rules loaded.
//   npm run test:ci                      (starts and stops the emulators)
//   npm test  with `npm run emulators` running in another terminal
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import firestoreRules from "../../firestore.rules?raw";
import { loadFullImage, saveFullImage } from "./images";

const { PROJECT_ID, MEMBER, HOST, PORT } = vi.hoisted(() => {
  // emulators:exec sets FIRESTORE_EMULATOR_HOST; otherwise assume `npm run emulators` defaults.
  const [host = "127.0.0.1", port = "8080"] = (
    (import.meta.env["FIRESTORE_EMULATOR_HOST"] as string | undefined) ?? "127.0.0.1:8080"
  ).split(":");
  return {
    // Its own project, so clearing data never touches the dev data or the rules tests.
    PROJECT_ID: "demo-recipe-app-images-test",
    MEMBER: "member@example.com",
    HOST: host,
    PORT: Number(port),
  };
});

// The app's Firestore, swapped for one on the emulator that is signed in as an allowed member.
vi.mock("../config/firebase", async () => {
  const { initializeApp } = await import("firebase/app");
  const { connectFirestoreEmulator, getFirestore } = await import("firebase/firestore");
  const app = initializeApp({ projectId: PROJECT_ID }, "images-emulator-test");
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, PORT, {
    mockUserToken: { sub: "member", email: MEMBER, email_verified: true },
  });
  return { db };
});

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: HOST, port: PORT, rules: firestoreRules },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (admin) => {
    await admin.firestore().doc(`allowed_users/${MEMBER}`).set({});
  });
});

describe("images data module", () => {
  test("saves a full image and loads it back", async () => {
    // About the size of a real full image (~150 KB of JPEG), to exercise a large document.
    const dataUrl = `data:image/jpeg;base64,${"A".repeat(200_000)}`;

    await saveFullImage("pasta", dataUrl);

    expect(await loadFullImage("pasta")).toBe(dataUrl);
  });

  test("replaces an existing image", async () => {
    await saveFullImage("pasta", "data:image/jpeg;base64,OLD");
    await saveFullImage("pasta", "data:image/jpeg;base64,NEW");

    expect(await loadFullImage("pasta")).toBe("data:image/jpeg;base64,NEW");
  });

  test("loads null for a recipe with no image", async () => {
    expect(await loadFullImage("no-such-recipe")).toBeNull();
  });
});
