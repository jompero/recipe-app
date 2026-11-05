import { useEffect, useState } from "react";
import { watchDays, type PlanDays } from "../data/menu.ts";

/** Plan days for a range of dates, kept up to date. */
export type LivePlanDays =
  | { status: "loading" }
  | { status: "ready"; days: PlanDays }
  | { status: "error"; message: string };

/**
 * Watches the Plan days from `first` to `last` (date keys, both included) while mounted. A new
 * range shows as loading until its own first answer arrives, never with the old range's days.
 */
export function usePlanDays(first: string, last: string): LivePlanDays {
  const range = `${first}/${last}`;
  const [live, setLive] = useState<{ range: string; value: LivePlanDays }>({
    range,
    value: { status: "loading" },
  });
  useEffect(
    () =>
      watchDays(
        first,
        last,
        (days) => setLive({ range, value: { status: "ready", days } }),
        (error) => setLive({ range, value: { status: "error", message: error.message } }),
      ),
    [first, last, range],
  );
  return live.range === range ? live.value : { status: "loading" };
}
