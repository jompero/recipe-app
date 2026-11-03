// "Export everything" and "Restore from file" (US-2.6): the backup method, and the way data moves
// to the live project at go-live (Epic 7). Restore overwrites what's in the file, never deletes.
import {
  collection,
  doc,
  getDocs,
  Timestamp,
  type DocumentData,
  type WriteBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  SECTIONS,
  TIMESTAMP_FIELDS,
  type ExportedDocument,
  type ExportFile,
  type Section,
} from "../backup/exportFile.ts";
import { commitInBatches, type BatchItem } from "./batches";
import { addFullImageToBatch, loadAllFullImages } from "./images";

/** Swaps the section's timestamp fields between Firestore Timestamps and ISO strings. */
function convertDates(
  section: Section,
  document: DocumentData,
  convert: (value: unknown) => unknown,
): ExportedDocument {
  const converted: ExportedDocument = { ...document };
  for (const field of TIMESTAMP_FIELDS[section]) {
    if (field in converted) converted[field] = convert(converted[field]);
  }
  return converted;
}

async function readSection(
  section: "recipes" | "menuDays",
): Promise<Record<string, ExportedDocument>> {
  const snapshot = await getDocs(collection(db, SECTIONS[section]));
  const documents: Record<string, ExportedDocument> = {};
  for (const document of snapshot.docs) {
    documents[document.id] = convertDates(section, document.data(), (value) =>
      value instanceof Timestamp ? value.toDate().toISOString() : value,
    );
  }
  return documents;
}

/** Reads every recipe, full image and menu day into one export file. */
export async function exportEverything(): Promise<ExportFile> {
  const [recipes, images, menuDays] = await Promise.all([
    readSection("recipes"),
    loadAllFullImages(),
    readSection("menuDays"),
  ]);
  const recipeImages = Object.fromEntries(
    Object.entries(images).map(([id, data]) => [id, { data }]),
  );
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    recipes,
    recipeImages,
    menuDays,
  };
}

/**
 * Writes every document in the file under its own ID, replacing what's there, with the dates from
 * the file. Documents that aren't in the file are left alone. Calls onProgress after each batch.
 */
export async function restoreEverything(
  file: ExportFile,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const items: BatchItem[] = [];
  for (const section of Object.keys(SECTIONS) as Section[]) {
    for (const [id, document] of Object.entries(file[section])) {
      const data = convertDates(section, document, (value) =>
        typeof value === "string" ? Timestamp.fromDate(new Date(value)) : value,
      );
      const addTo =
        section === "recipeImages"
          ? (batch: WriteBatch) => addFullImageToBatch(batch, id, String(data["data"]))
          : (batch: WriteBatch) => batch.set(doc(db, SECTIONS[section], id), data);
      items.push({ writes: 1, chars: JSON.stringify(document).length, addTo });
    }
  }
  await commitInBatches(items, onProgress);
}
