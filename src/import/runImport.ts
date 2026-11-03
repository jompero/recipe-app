// Runs a previewed Pepperplate import (US-2.5): compress each photo, then save everything.
import { saveRecipes, type RecipeToSave } from "../data/recipes.ts";
import { compressImage } from "../utils/imageCompressor.ts";
import type { ImportPreview } from "./pepperplateImport.ts";

export type ImportProgress =
  | { phase: "compressing"; done: number; total: number }
  | { phase: "saving"; done: number; total: number };

export interface ImportResult {
  saved: number;
  withPhoto: number;
  /** Photos that couldn't be compressed; their recipes are saved without a photo. */
  skippedPhotos: { fileName: string; reason: string }[];
}

export async function runImport(
  preview: ImportPreview,
  photoFiles: File[],
  onProgress: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  const photosByName = new Map(photoFiles.map((file) => [file.name, file]));
  const withPhotoFile = preview.recipes.filter(
    (recipe) => recipe.photoFileName !== null && photosByName.has(recipe.photoFileName),
  );
  const skippedPhotos: ImportResult["skippedPhotos"] = [];
  const toSave: RecipeToSave[] = [];

  let compressed = 0;
  onProgress({ phase: "compressing", done: 0, total: withPhotoFile.length });
  for (const { id, recipe, photoFileName } of preview.recipes) {
    const file = photoFileName === null ? undefined : photosByName.get(photoFileName);
    let images = { thumbnail: null as string | null, fullImage: null as string | null };
    if (file !== undefined) {
      try {
        const { full, thumbnail } = await compressImage(file);
        images = { thumbnail, fullImage: full };
      } catch (error) {
        skippedPhotos.push({
          fileName: file.name,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
      compressed += 1;
      onProgress({ phase: "compressing", done: compressed, total: withPhotoFile.length });
    }
    toSave.push({ id, recipe, ...images });
  }

  onProgress({ phase: "saving", done: 0, total: toSave.length });
  await saveRecipes(toSave, (done, total) => onProgress({ phase: "saving", done, total }));

  return {
    saved: toSave.length,
    withPhoto: toSave.filter((recipe) => recipe.fullImage !== null).length,
    skippedPhotos,
  };
}
