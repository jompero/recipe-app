// The edit form's photo draft (US-4.1): a chosen photo is compressed at once and held here until
// the form saves it with the recipe, in one batch. Shown by PhotoField.tsx.
import { useCallback, useRef, useState } from "react";
import type { PhotoChange } from "../data/recipes.ts";
import { compressImage, ImageTooLargeError } from "../utils/imageCompressor.ts";

export interface PhotoDraft {
  /** What Save does to the stored photo. Anything but "keep" is an unsaved change. */
  change: PhotoChange;
  /** The photo to show: the new one, the stored thumbnail, or null for none. */
  preview: string | null;
  /** Why the last photo couldn't be used (the previous photo stays). */
  error: string | null;
  /** True while a photo is being compressed. */
  busy: boolean;
  /**
   * Compresses an image and holds it as the new photo. Also for images from outside the form,
   * e.g. one fetched from a recipe site (issue 06).
   */
  stage: (image: Blob) => Promise<void>;
  remove: () => void;
}

/** The photo draft for a recipe whose stored thumbnail is `stored` (null for none or a new recipe). */
export function usePhotoDraft(stored: string | null): PhotoDraft {
  const [change, setChange] = useState<PhotoChange>("keep");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Only the latest photo chosen counts, if a slower earlier one finishes after it.
  const latest = useRef(0);

  const stage = useCallback(async (image: Blob) => {
    const attempt = ++latest.current;
    if (!image.type.startsWith("image/")) {
      setError(`${image instanceof File ? image.name : "That file"} isn't an image.`);
      return;
    }
    setError(null);
    setBusy(true);
    const file = image instanceof File ? image : new File([image], "photo", { type: image.type });
    try {
      const { thumbnail, full } = await compressImage(file);
      if (attempt === latest.current) setChange({ thumbnail, full });
    } catch (cause) {
      if (attempt !== latest.current) return;
      setError(
        cause instanceof ImageTooLargeError
          ? "That photo is too large to store, even at the lowest quality. Try a smaller one."
          : "Couldn't read that file as an image.",
      );
    } finally {
      if (attempt === latest.current) setBusy(false);
    }
  }, []);

  const remove = useCallback(() => {
    latest.current++;
    setBusy(false);
    setError(null);
    // Removing a photo that was never saved is no change at all.
    setChange(stored === null ? "keep" : "remove");
  }, [stored]);

  const preview = change === "keep" ? stored : change === "remove" ? null : change.full;
  return { change, preview, error, busy, stage, remove };
}
