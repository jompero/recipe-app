// The roller's random source, in its own module so tests can fake it without faking Math.random
// for everything else (Mantine makes element IDs with it).

/** A random number from 0 (included) to 1 (excluded). */
export function random(): number {
  return Math.random();
}
