/**
 * Date logic for monthly payments. Everything here is plain strings and numbers ("2026-10" for a month,
 * "2026-10-31" for a day), so no time zone can shift a date by a day.
 */

export const monthOf = (date: string): string => date.slice(0, 7);

const pad = (n: number) => String(n).padStart(2, "0");

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  if (monthNumber === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(monthNumber) ? 30 : 31;
}

/** The day a payment is due in a month. Day 31 becomes the last day of a shorter month. */
export function dueDate(month: string, dayOfMonth: number): string {
  return `${month}-${pad(Math.min(dayOfMonth, daysInMonth(month)))}`;
}

export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** Every month from `from` to `to`, both included. Empty when `from` is after `to`. */
export function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  for (let month = from; month <= to; month = addMonths(month, 1)) months.push(month);
  return months;
}

/** Today's date as "YYYY-MM-DD". The server clock is UTC. */
export const todayOf = (now: Date): string => now.toISOString().slice(0, 10);

type Schedule = { generatedThrough: string; dayOfMonth: number };

/**
 * The last month that counts as handled when a payment is created. The transaction the user logs is its own month's
 * payment, and old dates are not backfilled, so everything up to the later of that month and this one is handled.
 */
export function handledThroughFor(firstTransactionDate: string, today: string): string {
  const first = monthOf(firstTransactionDate);
  const current = monthOf(today);
  return first > current ? first : current;
}

/** The months still to create by today: after the handled ones, once the due date has been reached. */
export function dueMonths(schedule: Schedule, today: string): string[] {
  return monthsBetween(addMonths(schedule.generatedThrough, 1), monthOf(today)).filter(
    (month) => dueDate(month, schedule.dayOfMonth) <= today,
  );
}

/** The next day a payment is due, after today. */
export function nextChargeDate(schedule: Schedule, today: string): string {
  const current = monthOf(today);
  const first = addMonths(schedule.generatedThrough, 1);
  let month = first > current ? first : current;
  while (dueDate(month, schedule.dayOfMonth) <= today) month = addMonths(month, 1);
  return dueDate(month, schedule.dayOfMonth);
}
