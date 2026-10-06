// Dates are plain "YYYY-MM-DD" strings, the same shape the database `date` columns use.
// A "month" is written as its first day, e.g. "2026-09-01".

const MAX_CATCH_UP = 120; // never create more than 10 years of payments in one go

/** Today as YYYY-MM-DD in Swedish time, so a payment doesn't flip a day early or late around midnight. */
export const todayISO = (): string =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());

export const monthStart = (isoDate: string): string => `${isoDate.slice(0, 7)}-01`;

export function addMonths(monthStartIso: string, months: number): string {
  const [year, month] = monthStartIso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
}

/** The charge date inside a month. Months that are too short use their last day (31st becomes the 30th or 28th). */
export function chargeDate(monthStartIso: string, dayOfMonth: number): string {
  const [year, month] = monthStartIso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${monthStartIso.slice(0, 8)}${String(Math.min(dayOfMonth, lastDay)).padStart(2, "0")}`;
}

interface Schedule {
  dayOfMonth: number;
  startDate: string;
  generatedThrough: string | null;
}

/** The last month that already has its transaction. */
const coveredMonth = (schedule: Schedule): string => schedule.generatedThrough ?? monthStart(schedule.startDate);

export const nextChargeDate = (schedule: Schedule): string =>
  chargeDate(addMonths(coveredMonth(schedule), 1), schedule.dayOfMonth);

/** Every charge date after the covered month that has already arrived (is today or earlier). */
export function dueDates(schedule: Schedule, today: string): string[] {
  const dates: string[] = [];
  for (let month = addMonths(coveredMonth(schedule), 1); dates.length < MAX_CATCH_UP; month = addMonths(month, 1)) {
    const date = chargeDate(month, schedule.dayOfMonth);
    if (date > today) break;
    dates.push(date);
  }
  return dates;
}
