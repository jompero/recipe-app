// One command for local development:
//
//   npm run dev:all
//
// 1. Starts the Firebase emulators (with saved data), unless they're already running.
// 2. Waits until Auth and Firestore answer, then seeds the fake allowlist members.
// 3. Starts Vite with --host, so a phone on the same Wi-Fi can open the app too.
//
// Stop with Ctrl+C. The terminal sends it to every process, so the emulators still save
// their data to .emulator-data/ on the way out. Wait for "Export complete" before closing.
import { spawn, type ChildProcess } from "node:child_process";

const FIRESTORE = "http://127.0.0.1:8080/";
const AUTH = "http://127.0.0.1:9099/";
const READY_TIMEOUT_MS = 120_000;

async function answers(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1000) });
    return true;
  } catch {
    return false;
  }
}

async function emulatorsUp(): Promise<boolean> {
  return (await answers(FIRESTORE)) && (await answers(AUTH));
}

async function waitForEmulators(emulators: ChildProcess | null): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (!(await emulatorsUp())) {
    if (emulators && emulators.exitCode !== null) {
      throw new Error("The emulators stopped before they were ready (see the output above).");
    }
    if (Date.now() > deadline) throw new Error("The emulators didn't start within 2 minutes.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

/** Runs an npm script or command with the terminal's stdin/stdout, like typing it yourself. */
function run(command: string): ChildProcess {
  return spawn(command, { stdio: "inherit", shell: true });
}

function finished(child: ChildProcess): Promise<number> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) resolve(child.exitCode);
    else child.once("exit", (code) => resolve(code ?? 1));
  });
}

async function main(): Promise<void> {
  // Ctrl+C reaches the child processes directly; this script just waits for them to finish.
  process.on("SIGINT", () => console.log("\n[dev:all] Stopping… (emulators are saving data)"));

  let emulators: ChildProcess | null = null;
  if (await emulatorsUp()) {
    console.log("[dev:all] Emulators already running: using them.");
  } else {
    console.log("[dev:all] Starting the Firebase emulators…");
    emulators = run("npm run emulators");
  }

  await waitForEmulators(emulators);
  console.log("[dev:all] Emulators ready. Seeding…");
  const seedCode = await finished(run("npm run seed"));
  if (seedCode !== 0) throw new Error("Seeding failed (see the output above).");

  console.log("[dev:all] Starting Vite (also reachable from your phone on the same Wi-Fi)…");
  const vite = run("npx vite --host");

  await Promise.all([finished(vite), emulators ? finished(emulators) : Promise.resolve(0)]);
}

main().catch((error: unknown) => {
  console.error(`[dev:all] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
