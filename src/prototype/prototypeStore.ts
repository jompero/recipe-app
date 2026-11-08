// PROTOTYPE (EPIC-10 / US-10.1): throwaway. Lives only on the never-merged branch
// EPIC-10/US-10.1-prototypes. Layout variants on the real pages, picked from a floating bar.
//
// Each page registers its variant "dimensions" with usePrototypeVariant(); the bar shows every
// dimension registered right now (plus the shell's). Picks are kept in localStorage, so they
// survive reloads and moving between pages.
import { useMediaQuery } from "@mantine/hooks";
import { useEffect, useSyncExternalStore } from "react";

export interface Dimension {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

const STORAGE_KEY = "prototype:epic10";

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

let values: Record<string, string> = load();
let dimensions: Dimension[] = [];
let stats: Record<string, string> = {};
const listeners = new Set<() => void>();
let snapshot = { values, dimensions, stats };

function emit() {
  snapshot = { values, dimensions, stats };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePrototypeState() {
  return useSyncExternalStore(subscribe, () => snapshot);
}

export function setVariant(key: string, value: string) {
  values = { ...values, [key]: value };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Prototype: fine without storage.
  }
  emit();
}

/** A line of live state shown in the bar (e.g. "480px thumbs: 12 / 40"). */
export function setStat(key: string, text: string | null) {
  const next = { ...stats };
  if (text === null) delete next[key];
  else next[key] = text;
  stats = next;
  emit();
}

/** Registers a variant dimension while mounted and returns the picked value. */
export function usePrototypeVariant(dimension: Dimension): string {
  const state = usePrototypeState();
  const json = JSON.stringify(dimension);
  useEffect(() => {
    const dim = JSON.parse(json) as Dimension;
    dimensions = [...dimensions.filter((d) => d.key !== dim.key), dim];
    emit();
    return () => {
      dimensions = dimensions.filter((d) => d.key !== dim.key);
      emit();
    };
  }, [json]);
  const picked = state.values[dimension.key];
  return dimension.options.some((o) => o.value === picked) ? picked! : dimension.options[0]!.value;
}

/** The wide layout: Mantine's md breakpoint (62em, about 992px) and up. */
export function useWide(): boolean {
  return useMediaQuery("(min-width: 62em)") ?? false;
}

/** Bigger than a phone (Mantine sm, 48em): iPad portrait and up. */
export function useTablet(): boolean {
  return useMediaQuery("(min-width: 48em)") ?? false;
}
