// Photo compression for Firestore storage (ADR-0001): one image file in, two JPEG data URLs out.
// Used by the Pepperplate import (US-2.3) and later by camera and upload photos (Epic 4).
import imageCompression from "browser-image-compression";
// The library's web worker loads this script with importScripts(). Its default is a jsdelivr CDN
// URL; bundling our own copy keeps the site free of third-party requests.
import compressionLibUrl from "browser-image-compression/dist/browser-image-compression.js?url";

export interface CompressedImage {
  /** ~1024px on the long side, ~100–300 KB of JPEG. Stored in recipe_images/{id} (src/data/images.ts). */
  full: string;
  /** ~320px on the long side, ~15–40 KB of JPEG. Stored on the recipe document. */
  thumbnail: string;
}

export interface ImageVariant {
  maxWidthOrHeight: number;
  /**
   * Hard limit on the data URL's length. Data URLs are ASCII, so this is also its size in bytes.
   * firestore.rules (US-2.4) must allow at least this much.
   */
  maxChars: number;
}

export const FULL_IMAGE: ImageVariant = { maxWidthOrHeight: 1024, maxChars: 900_000 };
export const THUMBNAIL: ImageVariant = { maxWidthOrHeight: 320, maxChars: 60_000 };

/**
 * JPEG qualities tried in order until the image fits under its cap. The first one is the normal
 * case (ADR-0001: 0.75–0.8); the rest only matter for unusually detailed photos.
 */
export const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5, 0.4] as const;

/** Always JPEG, never WebP: Safari's canvas has quietly produced a large PNG instead (ADR-0001). */
const OUTPUT_TYPE = "image/jpeg";

export class ImageTooLargeError extends Error {
  constructor(fileName: string, variant: ImageVariant) {
    super(
      `${fileName} is still over ${Math.round(variant.maxChars / 1000)} KB at the lowest quality.`,
    );
    this.name = "ImageTooLargeError";
  }
}

/**
 * Compresses a photo into a full image and a thumbnail, both JPEG data URLs.
 * Throws ImageTooLargeError if either won't fit under its cap, or an Error if the file can't be
 * read as an image.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const full = await compressVariant(file, FULL_IMAGE);
  // Scale the thumbnail down from the full image: decoding a 1024px JPEG is much cheaper than
  // decoding a phone's 12-megapixel original again.
  const thumbnail = await compressVariant(full.file, THUMBNAIL);
  return { full: full.dataUrl, thumbnail: thumbnail.dataUrl };
}

async function compressVariant(
  file: File,
  variant: ImageVariant,
): Promise<{ file: File; dataUrl: string }> {
  for (const quality of QUALITY_STEPS) {
    let compressed: File;
    try {
      compressed = await imageCompression(file, {
        maxWidthOrHeight: variant.maxWidthOrHeight,
        fileType: OUTPUT_TYPE,
        initialQuality: quality,
        // No maxSizeMB on purpose: with one, the library also shrinks the resolution in 5% steps.
        // The cap is checked below instead, by lowering only the quality.
        useWebWorker: true,
        libURL: compressionLibUrl,
      });
    } catch (error) {
      throw new Error(`Couldn't read ${file.name} as an image.`, { cause: error });
    }
    const dataUrl = await toDataUrl(compressed);
    if (dataUrl.length <= variant.maxChars) return { file: compressed, dataUrl };
  }
  throw new ImageTooLargeError(file.name, variant);
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Couldn't read the compressed image."));
    reader.readAsDataURL(blob);
  });
}
