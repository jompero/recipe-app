// US-1.5: download every image linked from the Pepperplate export before the CDN dies.
//
//   node scripts/download-pepperplate-images.ts
//
// Reads docs/pepperplate-data/pepperplate_recipes/*.txt (never writes there) and saves the original
// bytes to .scratch/pepperplate-images/<recipe>.jpg plus manifest.json. Safe to re-run: images
// already saved are skipped.

import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  imageFileName,
  isJpeg,
  parseImageUrl,
  summarise,
  type ManifestEntry,
} from "./pepperplate-images/lib.ts";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipesDir = path.join(repoRoot, "docs", "pepperplate-data", "pepperplate_recipes");
const outDir = path.join(repoRoot, ".scratch", "pepperplate-images");

const CONCURRENCY = 4;
const ATTEMPTS = 3;
const TIMEOUT_MS = 60_000;

async function fileExists(file: string): Promise<boolean> {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function download(url: string): Promise<Uint8Array> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw lastError;
}

async function processRecipe(recipeFile: string): Promise<ManifestEntry> {
  const text = await readFile(path.join(recipesDir, recipeFile), "utf8");
  const url = parseImageUrl(text);
  if (!url) return { recipeFile, url: null, savedFile: null, status: "no-image" };

  const savedFile = imageFileName(recipeFile);
  const target = path.join(outDir, savedFile);
  if (await fileExists(target)) return { recipeFile, url, savedFile, status: "skipped-existing" };

  try {
    const bytes = await download(url);
    if (!isJpeg(bytes)) throw new Error(`not a JPEG (${bytes.length} bytes)`);
    // Write to a temp name first so an interrupted run never leaves a half file that looks saved.
    await writeFile(`${target}.part`, bytes);
    await rename(`${target}.part`, target);
    return { recipeFile, url, savedFile, status: "saved" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { recipeFile, url, savedFile: null, status: "failed", reason };
  }
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const recipeFiles = (await readdir(recipesDir)).filter((f) => f.endsWith(".txt")).sort();

  const entries: ManifestEntry[] = new Array(recipeFiles.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < recipeFiles.length) {
      const i = next++;
      const entry = await processRecipe(recipeFiles[i]!);
      entries[i] = entry;
      done++;
      if (entry.status === "saved" || entry.status === "failed") {
        console.log(`[${done}/${recipeFiles.length}] ${entry.status}: ${entry.recipeFile}${entry.reason ? ` (${entry.reason})` : ""}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(entries, null, 2) + "\n");
  const counts = summarise(entries);
  console.log("\nSummary:", counts);
  console.log(`Manifest: ${path.join(outDir, "manifest.json")}`);
  if (counts.failed > 0) process.exitCode = 1;
}

await main();
