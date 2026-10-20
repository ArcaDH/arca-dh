/** Date logic for monthly payments using ISO date strings and numbers. */

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
  return from > to ? [] : [from, ...monthsBetween(addMonths(from, 1), to)];
}

// Swedish time zone so due dates align with local midnight rather than UTC
const APP_TIME_ZONE = "Europe/Stockholm";
const todayFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: APP_TIME_ZONE });

/** Today's date as "YYYY-MM-DD", in Swedish time. */
export const todayOf = (now: Date): string => todayFormat.format(now);

type Schedule = { generatedThrough: string; dayOfMonth: number };

/** Determine the last month considered generated when creating a recurring schedule. */
export function handledThroughFor(firstTransactionDate: string, today: string, dayOfMonth: number): string {
  const first = monthOf(firstTransactionDate);
  const current = monthOf(today);
  const cutoff = dueDate(current, dayOfMonth) <= today ? current : addMonths(current, -1);
  return first > cutoff ? first : cutoff;
}

/** Pending due months up to today that have not yet been generated. */
export function dueMonths(schedule: Schedule, today: string): string[] {
  return monthsBetween(addMonths(schedule.generatedThrough, 1), monthOf(today)).filter(
    (month) => dueDate(month, schedule.dayOfMonth) <= today,
  );
}

// Find first due date strictly after today, starting from month
const firstDueAfter = (month: string, dayOfMonth: number, today: string): string =>
  dueDate(month, dayOfMonth) > today
    ? dueDate(month, dayOfMonth)
    : firstDueAfter(addMonths(month, 1), dayOfMonth, today);

/** The next day a payment is due, after today. */
export function nextChargeDate(schedule: Schedule, today: string): string {
  const current = monthOf(today);
  const first = addMonths(schedule.generatedThrough, 1);
  return firstDueAfter(first > current ? first : current, schedule.dayOfMonth, today);
}

// Format: YYYY-MM with valid month 01-12
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Whether a value is a valid "YYYY-MM" month string. */
export const isValidMonth = (month: unknown): month is string =>
  typeof month === "string" && MONTH_PATTERN.test(month.trim());
