// Loads an "Export everything" file (US-2.6) into the Firestore emulator (US-2.7), through its
// REST API with the "owner" token, which bypasses security rules. Emulator only.
import {
  SECTIONS,
  TIMESTAMP_FIELDS,
  type ExportFile,
  type Section,
} from "../../src/backup/exportFile.ts";
import { toFirestoreFields } from "./firestoreRest.ts";

/** Documents written at once: a few in flight is plenty for a local emulator. */
const CONCURRENCY = 8;

/** Replaces one document (a PATCH without an update mask overwrites the whole document). */
async function putDocument(
  { host, projectId }: { host: string; projectId: string },
  path: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const url = `http://${host}/v1/projects/${projectId}/databases/(default)/documents/${path}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) {
    throw new Error(`PATCH ${path} failed: HTTP ${response.status} ${await response.text()}`);
  }
}

/** Writes every document in the file under its own ID. Calls onProgress after each document. */
export async function loadBaseData(
  file: ExportFile,
  target: { host: string; projectId: string },
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const writes = (Object.keys(SECTIONS) as Section[]).flatMap((section) =>
    Object.entries(file[section]).map(([id, document]) => ({
      path: `${SECTIONS[section]}/${encodeURIComponent(id)}`,
      fields: toFirestoreFields(document, TIMESTAMP_FIELDS[section]),
    })),
  );

  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < writes.length) {
      const write = writes[next++];
      if (write === undefined) return;
      await putDocument(target, write.path, write.fields);
      done += 1;
      onProgress?.(done, writes.length);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

/** Whether the emulator holds at least one recipe (the seed never overwrites existing ones). */
export async function hasRecipes({
  host,
  projectId,
}: {
  host: string;
  projectId: string;
}): Promise<boolean> {
  const url = `http://${host}/v1/projects/${projectId}/databases/(default)/documents/recipes?pageSize=1`;
  const response = await fetch(url, { headers: { Authorization: "Bearer owner" } });
  if (!response.ok) {
    throw new Error(`Listing recipes failed: HTTP ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { documents?: unknown[] };
  return (body.documents?.length ?? 0) > 0;
}
