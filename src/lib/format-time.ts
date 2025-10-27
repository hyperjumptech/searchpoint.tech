/**
 * Format a given ISO date string into a human-readable relative time.
 */
export function formatTime(isoDate: string): string {
  if (!isoDate) return "Updated recently";

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "Updated recently";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "seconds"],
    [60, "minutes"],
    [24, "hours"],
    [7, "days"],
    [4.34524, "weeks"],
    [12, "months"],
    [Number.POSITIVE_INFINITY, "years"],
  ];

  let duration = diffInSeconds;
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) {
      const relative = rtf.format(-Math.floor(duration), unit);
      return `Updated ${relative}`;
    }
    duration /= amount;
  }

  return "Updated recently";
}
