const pad = (n: number) => String(n).padStart(2, "0");

/** A Date as "YYYY-MM-DD" in the user's own time zone. */
export const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** This month as "2026-09". */
export const currentMonth = (): string => toISODate(new Date()).slice(0, 7);

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const shifted = new Date(year, m - 1 + delta, 1);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}`;
}

export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(year, m - 1, 1));
}

/** "2026-09-18" becomes "18 sep". */
export function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" })
    .format(new Date(year, month - 1, day))
    .replace(/\.$/, "");
}
