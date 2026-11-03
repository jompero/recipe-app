// Writes many documents in as few batched writes as Firestore's limits allow (US-2.4, US-2.6).
import { writeBatch, type WriteBatch } from "firebase/firestore";
import { db } from "../config/firebase";

// A batched write is one request, limited to 10 MiB (Firestore quotas page, checked 2026-11-03;
// there's no longer a fixed count of writes). Stay well under it, measured in characters, which
// for these ASCII data URLs and mostly-ASCII text is close to bytes.
const BATCH_CHAR_BUDGET = 8_000_000;
// Also cap the writes per batch, so one request never carries an unusual number of them.
const BATCH_MAX_WRITES = 100;

/** Writes that must land in the same batch (e.g. a recipe and its photo), counted as one item. */
export interface BatchItem {
  /** Number of document writes `addTo` adds. */
  writes: number;
  /** Rough size of those writes, in characters. */
  chars: number;
  addTo: (batch: WriteBatch) => void;
}

/** Groups items into batches that stay under the size and write-count limits. */
function planBatches(items: BatchItem[]): BatchItem[][] {
  const batches: BatchItem[][] = [];
  let current: BatchItem[] = [];
  let chars = 0;
  let writes = 0;
  for (const item of items) {
    const full = chars + item.chars > BATCH_CHAR_BUDGET || writes + item.writes > BATCH_MAX_WRITES;
    if (current.length > 0 && full) {
      batches.push(current);
      current = [];
      chars = 0;
      writes = 0;
    }
    current.push(item);
    chars += item.chars;
    writes += item.writes;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/** Commits the items batch by batch, calling onProgress with the items done after each one. */
export async function commitInBatches(
  items: BatchItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  let done = 0;
  for (const group of planBatches(items)) {
    const batch = writeBatch(db);
    for (const item of group) item.addTo(batch);
    await batch.commit();
    done += group.length;
    onProgress?.(done, items.length);
  }
}
