// The backend sends amounts as plain kronor with decimals: 91.2 means 91,20 kr

export const MIN_AMOUNT_KR = 1;
export const MAX_AMOUNT_KR = 1_000_000;

const formatter = new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" });

export const formatKr = (kr: number): string => formatter.format(kr);

/** "91,20", "91.20" or "1 400" become a number of kronor. Returns null when the text isn't an amount. */
export function parseKr(input: string): number | null {
  const cleaned = input.replace(/[\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** Adds amounts in öre, so decimals like 0.1 + 0.2 don't drift. */
export const sumKr = (amounts: number[]): number => amounts.reduce((sum, kr) => sum + Math.round(kr * 100), 0) / 100;
