// ISO 8601 durations from schema.org recipes ("PT1H30M") as the plain text the edit form shows
// ("1 hr 30 min"). Only days, hours, minutes and seconds: recipes don't use years or weeks.

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;
const DURATION = new RegExp(
  String.raw`^P(?:${NUMBER}D)?(?:T(?:${NUMBER}H)?(?:${NUMBER}M)?(?:${NUMBER}S)?)?$`,
  "i",
);

/** A duration in whole minutes (seconds rounded), or null if the value isn't one. */
export function durationMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  const match = DURATION.exec(text);
  // "P" and "PT" alone match the pattern but say nothing.
  if (match === null || !/\d/.test(text)) return null;
  const [days, hours, minutes, seconds] = match
    .slice(1)
    .map((part) => (part === undefined ? 0 : Number(part.replace(",", "."))));
  return Math.round(
    (days ?? 0) * 24 * 60 + (hours ?? 0) * 60 + (minutes ?? 0) + (seconds ?? 0) / 60,
  );
}

/** "1 hr 30 min", "2 hr" or "45 min"; an empty string for zero. */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return [hours > 0 ? `${hours} hr` : "", minutes > 0 ? `${minutes} min` : ""]
    .filter((part) => part !== "")
    .join(" ");
}

/** An ISO 8601 duration as text, or an empty string if it is missing, invalid or zero. */
export function formatDuration(value: unknown): string {
  const minutes = durationMinutes(value);
  return minutes === null ? "" : formatMinutes(minutes);
}
