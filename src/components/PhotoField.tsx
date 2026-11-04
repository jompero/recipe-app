// The photo area of the edit form (US-4.1): pick, paste or drop an image into the photo draft
// (usePhotoDraft.ts), which the edit form saves with the recipe on Save.
import { Alert, Box, Button, Group, Image, Stack, Text } from "@mantine/core";
import { useEffect, useRef, type DragEvent } from "react";
import { LABEL_STYLE } from "../theme.ts";
import type { PhotoDraft } from "./usePhotoDraft.ts";

/** The first image file in a paste or drop, or null if there is none. */
function imageIn(data: DataTransfer | null): File | null {
  const file = Array.from(data?.files ?? []).find((f) => f.type.startsWith("image/"));
  if (file) return file;
  for (const item of Array.from(data?.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const itemFile = item.getAsFile();
      if (itemFile) return itemFile;
    }
  }
  return null;
}

const NOT_TEXT_INPUTS = [
  "button",
  "checkbox",
  "color",
  "file",
  "radio",
  "range",
  "reset",
  "submit",
];

/** Whether a paste into this element is meant for typing (so the photo area leaves it alone). */
function isTextBox(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLInputElement && !NOT_TEXT_INPUTS.includes(target.type);
}

const hasFiles = (event: { dataTransfer: DataTransfer | null }) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

/** The photo area: the current photo (or a placeholder), Add/Change and Remove. */
export function PhotoField({ photo }: { photo: PhotoDraft }) {
  const { preview, error, busy, stage, remove } = photo;
  const picker = useRef<HTMLInputElement>(null);

  // Ctrl+V of an image while the form is open, unless the paste goes into a text box.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isTextBox(event.target)) return;
      const image = imageIn(event.clipboardData);
      if (!image) return;
      event.preventDefault();
      void stage(image);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [stage]);

  // A file dropped next to the photo area would otherwise open in the tab, losing the form.
  useEffect(() => {
    const ignoreFiles = (event: globalThis.DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    document.addEventListener("dragover", ignoreFiles);
    document.addEventListener("drop", ignoreFiles);
    return () => {
      document.removeEventListener("dragover", ignoreFiles);
      document.removeEventListener("drop", ignoreFiles);
    };
  }, []);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    // A non-image file is staged too, so it gets the "isn't an image" error. Dragging an image
    // straight from another tab usually gives a link, not a file: not promised (spec), ignored.
    const file = imageIn(event.dataTransfer) ?? event.dataTransfer.files[0];
    if (file) void stage(file);
  };

  return (
    <Stack
      gap="xs"
      role="group"
      aria-label="Photo"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <Text component="span" size="sm" fw={500}>
        Photo
      </Text>
      {preview ? (
        <Image src={preview} alt="Recipe photo" mah={320} fit="contain" radius="sm" />
      ) : (
        <Box
          p="lg"
          style={{
            border: "1px dashed var(--mantine-color-gray-5)",
            borderRadius: "var(--mantine-radius-sm)",
            textAlign: "center",
          }}
        >
          <Text c="dimmed" style={LABEL_STYLE}>
            No photo. Choose one, paste one or drop one here.
          </Text>
        </Box>
      )}
      <Group gap="sm">
        <Button variant="light" onClick={() => picker.current?.click()} loading={busy}>
          {preview ? "Change photo" : "Add photo"}
        </Button>
        {preview && (
          <Button variant="subtle" color="red" onClick={remove} disabled={busy}>
            Remove photo
          </Button>
        )}
      </Group>
      {/* No `capture` attribute: phones then offer both the camera and the photo library. */}
      <input
        ref={picker}
        type="file"
        accept="image/*"
        hidden
        aria-label="Choose a photo"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void stage(file);
        }}
      />
      {error && (
        <Alert color="red" title="Couldn't use that photo">
          {error}
        </Alert>
      )}
    </Stack>
  );
}
