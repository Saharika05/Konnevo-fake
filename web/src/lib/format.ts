const day = (d: Date) => d.getDate();
const month = (d: Date) => d.toLocaleString("en-GB", { month: "short" });

/** "14–15 Nov", "22 Nov", or "28 Nov – 2 Dec". Input dates are YYYY-MM-DD. */
export function formatDateRange(start: string, end?: string): string {
  const s = new Date(`${start}T00:00:00`);
  if (!end || end === start) return `${day(s)} ${month(s)}`;
  const e = new Date(`${end}T00:00:00`);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${day(s)}–${day(e)} ${month(s)}`;
  }
  return `${day(s)} ${month(s)} – ${day(e)} ${month(e)}`;
}

/** "2025-11" becomes "Nov 2025". */
export function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "short", year: "numeric" });
}

/** "starts in 5 days", "starts tomorrow", "happening now" or "ended". Dates are YYYY-MM-DD. */
export function startsIn(start: string, end?: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end || start}T00:00:00`);
  const days = Math.round((startDate.getTime() - today.getTime()) / 86_400_000);
  if (endDate < today) return "Ended";
  if (days <= 0) return "Happening now";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}
