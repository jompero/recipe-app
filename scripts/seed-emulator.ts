// Fills the running Firestore emulator with fake allowlist entries, so a fresh clone or a wiped
// emulator is one command from a usable app. Safe to re-run (documents are overwritten).
//
//   npm run seed        (with `npm run emulators` running in another terminal)
//
// Uses the emulator's REST API with the "owner" token, which bypasses security rules. Fake
// @example.com addresses only: real member emails never go in the repo (ADR-0002).

const PROJECT_ID = "demo-recipe-app";
const host = process.env["FIRESTORE_EMULATOR_HOST"] ?? "127.0.0.1:8080";

/** Sign in with one of these (via the emulator's fake Google popup) to be a member. */
const SEED_MEMBERS = ["member@example.com", "alex@example.com"];

async function setDocument(path: string, fields: Record<string, unknown> = {}): Promise<void> {
  const url = `http://${host}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) {
    throw new Error(`PATCH ${path} failed: HTTP ${response.status} ${await response.text()}`);
  }
}

async function main(): Promise<void> {
  for (const email of SEED_MEMBERS) {
    await setDocument(`allowed_users/${encodeURIComponent(email)}`);
    console.log(`allowed_users/${email}`);
  }
  console.log(`Seeded ${SEED_MEMBERS.length} members into the emulator at ${host}.`);
}

main().catch((error: unknown) => {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  console.error(
    cause.includes("ECONNREFUSED")
      ? `Can't reach the Firestore emulator at ${host}. Start it first with: npm run emulators`
      : error,
  );
  process.exitCode = 1;
});
