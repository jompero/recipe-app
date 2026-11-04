// Recipes in Firestore: recipes/{id}, with the full photo in recipe_images/{id} (ADR-0001).
import {
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
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { RecipeDraft } from "../parsing/types.ts";
import { commitInBatches, type BatchItem } from "./batches";
import { addFullImageDeletionToBatch, addFullImageToBatch } from "./images";

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

/** A photo to save with a recipe: two JPEG data URLs from compressImage(). */
export interface RecipePhoto {
  thumbnail: string;
  full: string;
}

/** What saving an edit does to the recipe's photo: keep it, replace it with a new one, or remove it. */
export type PhotoChange = "keep" | "remove" | RecipePhoto;

/**
 * Saves an edited recipe, and any photo change in the same batch. Only the edited text fields,
 * updatedAt and (if it changes) the photo fields are sent; the archive flag and createdAt stay as
 * stored (the rules still check the whole document). Removing the photo deletes its full image.
 * Fails, writing nothing, if the recipe doesn't exist. Last save wins: there's no conflict check.
 */
export async function updateRecipe(
  id: string,
  recipe: RecipeDraft,
  photo: PhotoChange = "keep",
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  if (photo === "keep") {
    await updateDoc(ref, { ...recipe, updatedAt: serverTimestamp() });
    return;
  }
  const batch = writeBatch(db);
  const update = { ...recipe, updatedAt: serverTimestamp() };
  if (photo === "remove") {
    batch.update(ref, { ...update, thumbnail: null, hasImage: false });
    addFullImageDeletionToBatch(batch, id);
  } else {
    batch.update(ref, { ...update, thumbnail: photo.thumbnail, hasImage: true });
    addFullImageToBatch(batch, id, photo.full);
  }
  await batch.commit();
}

/**
 * Adds a recipe typed in by hand, with its photo (if any) in the same batch, and returns its new
 * ID. The ID is made in the browser so both documents can be written together.
 */
export async function createRecipe(
  recipe: RecipeDraft,
  photo: RecipePhoto | null = null,
): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  const batch = writeBatch(db);
  batch.set(ref, {
    ...recipe,
    thumbnail: photo?.thumbnail ?? null,
    hasImage: photo !== null,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (photo !== null) addFullImageToBatch(batch, ref.id, photo.full);
  await batch.commit();
  return ref.id;
}
