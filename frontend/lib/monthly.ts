const SUFFIXES: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };

/** 1 becomes "1st", 22 becomes "22nd", 11 becomes "11th". */
export function ordinal(day: number): string {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`;
  return `${day}${SUFFIXES[day % 10] ?? "th"}`;
}

/** The day of the month in "2026-10-18": 18. */
export const dayOfDate = (isoDate: string): number => Number(isoDate.slice(8, 10));

/** "25" becomes 25. Returns null unless the text is a whole number from 1 to 31. */
export function parseDayOfMonth(input: string): number | null {
  const text = input.trim();
  if (!/^\d{1,2}$/.test(text)) return null;
  const day = Number(text);
  return day >= 1 && day <= 31 ? day : null;
}

/** The sentence under the "Day of the month" field: what will happen, or what to fix. */
export function repeatHint(day: number | null): string {
  if (day === null) return "Enter a day from 1 to 31.";
  const shorterMonths = day > 28 ? " In shorter months it's the last day." : "";
  return `Added automatically on the ${ordinal(day)} of every month, starting next month.${shorterMonths}`;
}
