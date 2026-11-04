import { useState } from "react";
import { useLocation } from "react-router";

interface StoredTicks {
  /** The history entry (visit) the ticks belong to. */
  entry: string;
  ticks: string[];
}

/**
 * Tick-off state for one recipe page, on this phone only (sessionStorage). Ticks belong to this
 * visit: a reload keeps them (same history entry), while leaving and opening the recipe again
 * starts fresh.
 */
export function useTicks(recipeId: string): [ReadonlySet<string>, (line: string) => void] {
  const { key: entry } = useLocation();
  const storageKey = `recipe-ticks:${recipeId}`;
  const [ticks, setTicks] = useState<ReadonlySet<string>>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as StoredTicks | null;
      return new Set(stored?.entry === entry ? stored.ticks : []);
    } catch {
      return new Set();
    }
  });

  const toggle = (line: string) => {
    const next = new Set(ticks);
    if (next.has(line)) next.delete(line);
    else next.add(line);
    setTicks(next);
    const stored: StoredTicks = { entry, ticks: [...next] };
    sessionStorage.setItem(storageKey, JSON.stringify(stored));
  };
  return [ticks, toggle];
}
