import type { EntryScale } from "../data/menu.ts";

/** A Plan entry's scale as shown: "½×", "1×", "2×", "3×". */
export const scaleLabel = (scale: EntryScale) => `${scale === 0.5 ? "½" : String(scale)}×`;
