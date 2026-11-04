// Recipes in Firestore: recipes/{id}, with the full photo in recipe_images/{id} (ADR-0001).
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { RecipeDraft } from "../parsing/types.ts";
import { commitInBatches, type BatchItem } from "./batches";
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

/**
 * Saves recipes under their given IDs (replacing any existing ones), each with its full image, in
 * as few batched writes as the limits allow. Calls onProgress after each batch.
 */
export async function saveRecipes(
  recipes: RecipeToSave[],
  onProgress?: (saved: number, total: number) => void,
): Promise<void> {
  const items = recipes.map(({ id, recipe, thumbnail, fullImage }): BatchItem => ({
    writes: fullImage === null ? 1 : 2,
    chars: JSON.stringify(recipe).length + (thumbnail?.length ?? 0) + (fullImage?.length ?? 0),
    addTo: (batch) => {
      batch.set(doc(db, COLLECTION, id), {
        ...recipe,
        thumbnail,
        hasImage: fullImage !== null,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (fullImage !== null) addFullImageToBatch(batch, id, fullImage);
    },
  }));
  await commitInBatches(items, onProgress);
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

function storedRecipe(snapshotDoc: QueryDocumentSnapshot): StoredRecipe {
  // A write from this device shows up before the server has set its dates: use the estimate.
  return fromFirestore(snapshotDoc.id, snapshotDoc.data({ serverTimestamps: "estimate" }));
}

/**
 * Calls onChange with every recipe (archived ones included) now and after every change, from any
 * device. Returns a function that stops listening.
 */
export function watchRecipes(
  onChange: (recipes: StoredRecipe[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, COLLECTION),
    (snapshot) => onChange(snapshot.docs.map(storedRecipe)),
    onError,
  );
}

/**
 * Archives a recipe (hidden from the cookbook and search) or brings it back. Nothing in the app
 * deletes recipes. Fails if the recipe doesn't exist.
 */
export async function setArchived(id: string, archived: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { archived, updatedAt: serverTimestamp() });
}

/**
 * Saves an edited recipe. Only the edited text fields and updatedAt are sent; the photo, the
 * archive flag and createdAt stay as stored (the rules still check the whole document). Fails if
 * the recipe doesn't exist. Last save wins: there's no conflict check.
 */
export async function updateRecipe(id: string, recipe: RecipeDraft): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...recipe, updatedAt: serverTimestamp() });
}

/** Adds a recipe typed in by hand (no photo until Epic 4) and returns its new ID. */
export async function createRecipe(recipe: RecipeDraft): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...recipe,
    thumbnail: null,
    hasImage: false,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
