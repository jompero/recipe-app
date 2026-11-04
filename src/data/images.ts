// Full-size recipe photos, one document per recipe: recipe_images/{recipeId} = { data }.
// The only code that knows where full images live (ADR-0001), so moving them to Firebase Storage
// later changes this module and nothing else. Thumbnails travel on the recipe document instead.
import { collection, doc, getDoc, getDocs, setDoc, type WriteBatch } from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION = "recipe_images";

/** Adds saving a recipe's full image to a batch, so it's written together with its recipe. */
export function addFullImageToBatch(batch: WriteBatch, recipeId: string, dataUrl: string): void {
  batch.set(doc(db, COLLECTION, recipeId), { data: dataUrl });
}

/** Adds deleting a recipe's full image to a batch, for when its photo is removed. */
export function addFullImageDeletionToBatch(batch: WriteBatch, recipeId: string): void {
  batch.delete(doc(db, COLLECTION, recipeId));
}

/** Saves (or replaces) a recipe's full image: a JPEG data URL from compressImage(). */
export async function saveFullImage(recipeId: string, dataUrl: string): Promise<void> {
  await setDoc(doc(db, COLLECTION, recipeId), { data: dataUrl });
}

/** Loads a recipe's full image as a data URL, or null if it has none. */
export async function loadFullImage(recipeId: string): Promise<string | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, recipeId));
  const data: unknown = snapshot.get("data");
  return typeof data === "string" ? data : null;
}

/** Every recipe's full image, keyed by recipe ID (for "Export everything", US-2.6). */
export async function loadAllFullImages(): Promise<Record<string, string>> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const images: Record<string, string> = {};
  for (const image of snapshot.docs) {
    const data: unknown = image.get("data");
    if (typeof data === "string") images[image.id] = data;
  }
  return images;
}
