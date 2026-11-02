// Pure helpers for the Pepperplate image rescue (US-1.5). No I/O here, so they're easy to test.

/** Returns the URL on the recipe's `Image:` line, or null when the line is missing or empty. */
export function parseImageUrl(recipeText: string): string | null {
  for (const line of recipeText.split(/\r?\n/)) {
    const match = /^Image:\s*(\S+)\s*$/.exec(line);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** `15MinPulledOatsMushroomPasta.txt` -> `15MinPulledOatsMushroomPasta.jpg` */
export function imageFileName(recipeFileName: string): string {
  return recipeFileName.replace(/\.txt$/i, "") + ".jpg";
}

/** JPEG files start with the bytes FF D8 FF. */
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export type ManifestStatus = "saved" | "skipped-existing" | "no-image" | "failed";

export interface ManifestEntry {
  recipeFile: string;
  url: string | null;
  savedFile: string | null;
  status: ManifestStatus;
  reason?: string;
}

export function summarise(entries: ManifestEntry[]): Record<ManifestStatus, number> {
  const counts: Record<ManifestStatus, number> = {
    saved: 0,
    "skipped-existing": 0,
    "no-image": 0,
    failed: 0,
  };
  for (const entry of entries) counts[entry.status]++;
  return counts;
}
