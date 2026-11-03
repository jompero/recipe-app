// Recipes in Firestore: recipes/{id}, with the full photo in recipe_images/{id} (ADR-0001).
import {
  collection,
  doc,
  documentId,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { RecipeDraft } from "../parsing/types.ts";
import { addFullImageToBatch } from "./images";

const COLLECTION = "recipes";

/** A parsed recipe to save under a chosen ID, with its compressed images (or null). */
export interface RecipeToSave {
  id: string;
  recipe: RecipeDraft;
  thumbnail: string | null;
  fullImage: string | null;
}

/** A recipe as stored, with its ID and dates. */
export interface StoredRecipe extends RecipeDraft {
  id: string;
  thumbnail: string | null;
  hasImage: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// A batched write is one request, limited to 10 MiB (Firestore quotas page, checked 2026-11-03;
// there's no longer a fixed count of writes). Stay well under it, measured in characters, which
// for these ASCII data URLs and mostly-ASCII text is close to bytes.
const BATCH_CHAR_BUDGET = 8_000_000;
// Also cap the writes per batch, so one request never carries an unusual number of them.
const BATCH_MAX_WRITES = 100;

/** Rough size of a recipe's writes, in characters. */
function sizeOf(item: RecipeToSave): number {
  return (
    JSON.stringify(item.recipe).length +
    (item.thumbnail?.length ?? 0) +
    (item.fullImage?.length ?? 0)
  );
}

/** Groups recipes into batches that stay under the size and write-count limits. */
function planBatches(recipes: RecipeToSave[]): RecipeToSave[][] {
  const batches: RecipeToSave[][] = [];
  let current: RecipeToSave[] = [];
  let chars = 0;
  let writes = 0;
  for (const item of recipes) {
    const itemChars = sizeOf(item);
    const itemWrites = item.fullImage === null ? 1 : 2;
    if (
      current.length > 0 &&
      (chars + itemChars > BATCH_CHAR_BUDGET || writes + itemWrites > BATCH_MAX_WRITES)
    ) {
      batches.push(current);
      current = [];
      chars = 0;
      writes = 0;
    }
    current.push(item);
    chars += itemChars;
    writes += itemWrites;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * Saves recipes under their given IDs (replacing any existing ones), each with its full image, in
 * as few batched writes as the limits allow. Calls onProgress after each batch.
 */
export async function saveRecipes(
  recipes: RecipeToSave[],
  onProgress?: (saved: number, total: number) => void,
): Promise<void> {
  let saved = 0;
  for (const items of planBatches(recipes)) {
    const batch = writeBatch(db);
    for (const { id, recipe, thumbnail, fullImage } of items) {
      batch.set(doc(db, COLLECTION, id), {
        ...recipe,
        thumbnail,
        hasImage: fullImage !== null,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (fullImage !== null) addFullImageToBatch(batch, id, fullImage);
    }
    await batch.commit();
    saved += items.length;
    onProgress?.(saved, recipes.length);
  }
}

/** Returns which of the given recipe IDs already exist. */
export async function existingRecipeIds(ids: string[]): Promise<string[]> {
  // An `in` filter takes at most 30 values (Firestore queries page, checked 2026-11-03).
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(collection(db, COLLECTION), where(documentId(), "in", chunk))),
    ),
  );
  return snapshots.flatMap((snapshot) => snapshot.docs.map((snapshotDoc) => snapshotDoc.id));
}

function toDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : new Date(0);
}

function fromFirestore(id: string, data: DocumentData): StoredRecipe {
  // The rules guarantee the shape (firestore.rules, isValidRecipe).
  const { createdAt, updatedAt, ...rest } = data as Omit<
    StoredRecipe,
    "id" | "createdAt" | "updatedAt"
  > & {
    createdAt: unknown;
    updatedAt: unknown;
  };
  return { id, ...rest, createdAt: toDate(createdAt), updatedAt: toDate(updatedAt) };
}

/** Reads every recipe, archived ones included. */
export async function loadAllRecipes(): Promise<StoredRecipe[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((snapshotDoc) => fromFirestore(snapshotDoc.id, snapshotDoc.data()));
}
