/** Dates are shown in Kathmandu time — the only clock the shop works to. */
const KATHMANDU = "Asia/Kathmandu";

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: KATHMANDU,
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: KATHMANDU,
  }).format(new Date(value));
}

/** "2 hours ago" reads faster than a timestamp in an activity list. */
export function relativeTime(value: Date | string) {
  const then = new Date(value).getTime();
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["week", 604800],
    ["month", 2592000],
    ["year", 31536000],
  ];

  let [unit, size] = units[0];
  for (const [u, s] of units) {
    if (seconds >= s) [unit, size] = [u, s];
  }
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    -Math.round(seconds / size),
    unit,
  );
}
