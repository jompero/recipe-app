import { Indicator, Modal } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useState } from "react";
import { addDays, dayLabel, mondayOf, parseDateKey, toDateKey } from "../plan/week.ts";
import { usePlanDays } from "./usePlanDays.ts";

/**
 * Picks a Plan day from a month calendar (Move to…, Add to plan…). Days that already have entries
 * are marked. Opens on `start`'s month; `selected` (if any) is shown as the current choice.
 */
export function PlanDatePicker({
  opened,
  title,
  start,
  selected = null,
  onPick,
  onClose,
}: {
  opened: boolean;
  title: string;
  start: string;
  selected?: string | null;
  onPick: (date: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      {/* Mounted only while open, so it watches the Plan only then and opens on `start` again. */}
      {opened && <MonthPicker start={start} selected={selected} onPick={onPick} />}
    </Modal>
  );
}

/** The dates the calendar shows for the month of `date`: whole weeks, Monday to Sunday. */
function monthGrid(date: Date): { first: string; last: string } {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    first: toDateKey(mondayOf(firstOfMonth)),
    last: toDateKey(addDays(mondayOf(lastOfMonth), 6)),
  };
}

function MonthPicker({
  start,
  selected,
  onPick,
}: {
  start: string;
  selected: string | null;
  onPick: (date: string) => void;
}) {
  /** Any day in the month on screen. */
  const [shown, setShown] = useState(start);
  const grid = monthGrid(parseDateKey(shown) ?? new Date());
  const live = usePlanDays(grid.first, grid.last);
  const planned = (date: string) => live.status === "ready" && (live.days[date]?.length ?? 0) > 0;

  return (
    <DatePicker
      value={selected}
      onChange={(date) => {
        if (date) onPick(date);
      }}
      date={shown}
      onDateChange={setShown}
      firstDayOfWeek={1}
      highlightToday
      fullWidth
      maxLevel="year"
      getDayAriaLabel={(date) => {
        const day = parseDateKey(date);
        const label = day ? dayLabel(day) : date;
        return planned(date) ? `${label}, has meals` : label;
      }}
      getDayProps={(date) => (planned(date) ? { "data-planned": true } : {})}
      renderDay={(date) => (
        <Indicator size={5} color="linen.6" offset={-4} disabled={!planned(date)}>
          <div>{Number(date.slice(8, 10))}</div>
        </Indicator>
      )}
    />
  );
}
