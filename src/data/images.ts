// Full-size recipe photos, one document per recipe: recipe_images/{recipeId} = { data }.
// The only code that knows where full images live (ADR-0001), so moving them to Firebase Storage
// later changes this module and nothing else. Thumbnails travel on the recipe document instead.
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION = "recipe_images";

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
