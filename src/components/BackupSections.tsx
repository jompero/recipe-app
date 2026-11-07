// The Data page's "Export everything" and "Restore from file" sections (US-2.6).
import { Alert, Button, Group, Modal, Progress, Stack, Text, Title } from "@mantine/core";
import { useState, type ChangeEvent } from "react";
import { parseExportFile, type ExportFile } from "../backup/exportFile.ts";
import { exportEverything, restoreEverything } from "../data/backup.ts";
import { NeedsConnection } from "./NeedsConnection.tsx";
import { usePhoneOffline } from "./useOffline.ts";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "2 recipes, 1 photo and 1 menu day" */
function describeContents(file: ExportFile): string {
  const recipes = plural(Object.keys(file.recipes).length, "recipe", "recipes");
  const photos = plural(Object.keys(file.recipeImages).length, "photo", "photos");
  const days = plural(Object.keys(file.menuDays).length, "menu day", "menu days");
  return `${recipes}, ${photos} and ${days}`;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Hands the browser a file to save, named after the export's date. */
function download(file: ExportFile) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `recipe-app-export-${file.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

type ExportState =
  | { step: "idle" }
  | { step: "exporting" }
  | { step: "done"; file: ExportFile }
  | { step: "failed"; message: string };

export function ExportSection() {
  const [state, setState] = useState<ExportState>({ step: "idle" });

  const runExport = async () => {
    setState({ step: "exporting" });
    try {
      const file = await exportEverything();
      download(file);
      setState({ step: "done", file });
    } catch (error) {
      setState({ step: "failed", message: messageOf(error) });
    }
  };

  return (
    <Stack>
      <Title order={3}>Export everything</Title>
      <Text size="sm" c="dimmed">
        Downloads every recipe, photo and menu day as one file. Keep it somewhere safe: it&apos;s
        the only backup.
      </Text>
      <Group>
        <Button onClick={() => void runExport()} loading={state.step === "exporting"}>
          Export everything
        </Button>
      </Group>
      {state.step === "done" && (
        <Alert color="green">Exported {describeContents(state.file)}.</Alert>
      )}
      {state.step === "failed" && <Alert color="red">Export failed: {state.message}</Alert>}
    </Stack>
  );
}

type RestoreState =
  | { step: "idle" }
  | { step: "picked"; file: ExportFile }
  | { step: "confirming"; file: ExportFile }
  | { step: "restoring"; done: number; total: number }
  | { step: "done"; total: number }
  | { step: "refused"; message: string }
  | { step: "failed"; file: ExportFile; message: string };

export function RestoreSection() {
  const offline = usePhoneOffline();
  const [state, setState] = useState<RestoreState>({ step: "idle" });

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.currentTarget.files?.[0];
    if (picked === undefined) return;
    try {
      setState({ step: "picked", file: parseExportFile(await picked.text()) });
    } catch (error) {
      setState({ step: "refused", message: messageOf(error) });
    }
  };

  const runRestore = async (file: ExportFile) => {
    setState({ step: "restoring", done: 0, total: 0 });
    try {
      let restored = 0;
      await restoreEverything(file, (done, total) => {
        restored = total;
        setState({ step: "restoring", done, total });
      });
      setState({ step: "done", total: restored });
    } catch (error) {
      setState({ step: "failed", file, message: messageOf(error) });
    }
  };

  const file =
    state.step === "picked" || state.step === "confirming" || state.step === "failed"
      ? state.file
      : null;

  return (
    <Stack>
      <Title order={3}>Restore from file</Title>
      <Text size="sm" c="dimmed">
        Puts an exported file back. Nothing is written until you confirm.
      </Text>
      <Group>
        <Button component="label" variant="default">
          Choose an export file
          <input
            type="file"
            accept=".json,application/json"
            onChange={(event) => void pick(event)}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          />
        </Button>
      </Group>

      {file !== null && (
        <Stack>
          <Text>
            This file holds {describeContents(file)}, exported on {file.exportedAt.slice(0, 10)}.
          </Text>
          <Group>
            <Button
              color="orange"
              disabled={offline}
              onClick={() => setState({ step: "confirming", file })}
            >
              Restore
            </Button>
            {offline && <NeedsConnection />}
          </Group>
        </Stack>
      )}
      {state.step === "restoring" && (
        <Stack gap={4}>
          <Text size="sm">
            Restoring: {state.done} of {state.total}
          </Text>
          <Progress value={state.total === 0 ? 0 : (100 * state.done) / state.total} />
        </Stack>
      )}
      {state.step === "done" && (
        <Alert color="green">Restored {plural(state.total, "document", "documents")}.</Alert>
      )}
      {state.step === "refused" && <Alert color="red">{state.message}</Alert>}
      {state.step === "failed" && <Alert color="red">Restore failed: {state.message}</Alert>}

      <Modal
        opened={state.step === "confirming"}
        onClose={() => file !== null && setState({ step: "picked", file })}
        title="Restore from this file?"
      >
        <Stack>
          <Text>
            Everything in the file replaces the version in the app. Nothing that isn&apos;t in the
            file is changed or deleted.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => file !== null && setState({ step: "picked", file })}
            >
              Cancel
            </Button>
            <Button
              color="orange"
              disabled={offline}
              onClick={() => file !== null && void runRestore(file)}
            >
              Restore
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
