// A stand-in for src/data/connection.ts, put in place for every app test by vitest.setup.ts: the
// member shell listens to it on every page, and the real one would load Firebase. Tests that care
// about the offline strip drive it with setFromCache().

type Listener = (fromCache: boolean) => void;
const listeners = new Set<Listener>();
let current = false;

export function watchFromCache(onChange: Listener): () => void {
  listeners.add(onChange);
  onChange(current);
  return () => listeners.delete(onChange);
}

/** Tells every listener that Firestore is (or isn't) working from its offline copy. */
export function setFromCache(fromCache: boolean): void {
  current = fromCache;
  for (const listener of listeners) listener(fromCache);
}

/** Back to "reaching the server", between tests. */
export function resetConnection(): void {
  current = false;
  listeners.clear();
}
