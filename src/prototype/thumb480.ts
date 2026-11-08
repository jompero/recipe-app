// PROTOTYPE (EPIC-10 / US-10.1): throwaway. Makes 480px thumbnails in the browser from each
// recipe's stored full image, so the cookbook can compare them with today's 320px ones. Nothing is
// saved. Canvas JPEG at 0.8, close to what the real compressor would make.
import { useEffect, useState } from "react";
import { loadFullImage } from "../data/images.ts";
import { setStat } from "./prototypeStore.ts";

const SIZE = 480;
const QUALITY = 0.8;
const CONCURRENCY = 3;

const cache = new Map<string, string | null>();
const waiting: { id: string; resolve: () => void }[] = [];
const listeners = new Set<() => void>();
let running = 0;
let requested = 0;
let totalChars = 0;
let made = 0;

function report() {
  const avg = made ? Math.round(totalChars / made / 1000) : 0;
  setStat(
    "thumb480",
    `480px thumbs: ${String(cache.size)} / ${String(requested)} · avg ${String(avg)} KB`,
  );
  for (const listener of listeners) listener();
}

async function make(id: string): Promise<string | null> {
  const full = await loadFullImage(id);
  if (!full) return null;
  const img = new Image();
  img.src = full;
  await img.decode();
  const scale = Math.min(1, SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", QUALITY);
}

function pump() {
  while (running < CONCURRENCY && waiting.length > 0) {
    const job = waiting.shift()!;
    running++;
    void make(job.id)
      .catch(() => null)
      .then((url) => {
        cache.set(job.id, url);
        if (url) {
          made++;
          totalChars += url.length;
        }
      })
      .finally(() => {
        running--;
        job.resolve();
        report();
        pump();
      });
  }
}

const queued = new Set<string>();

function request(id: string) {
  if (queued.has(id)) return;
  queued.add(id);
  requested++;
  waiting.push({ id, resolve: () => {} });
  report();
  pump();
}

/** The 480px thumbnail once made (null until then, or if the recipe has no full image). */
export function useThumb480(id: string, hasImage: boolean, enabled: boolean): string | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || !hasImage) return;
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    request(id);
    return () => {
      listeners.delete(listener);
    };
  }, [id, hasImage, enabled]);
  return enabled ? (cache.get(id) ?? null) : null;
}
