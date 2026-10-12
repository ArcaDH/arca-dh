// The backend sends amounts as plain kronor with decimals: 91.2 means 91,20 kr.
// Its sign rule: money going out is negative, money coming in is positive.

import type { MoneyDirection } from "@/types/transaction";

export const MIN_AMOUNT_KR = 1;
export const MAX_AMOUNT_KR = 1_000_000;

const formatter = new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" });
const signedFormatter = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  signDisplay: "exceptZero",
});

const wholeFormatter = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

export const formatKr = (kr: number): string => formatter.format(kr);

export const formatWholeKr = (kr: number): string => wholeFormatter.format(kr);

/** Like formatKr, but always shows the sign: "−91,20 kr" or "+500,00 kr". */
export const formatSignedKr = (kr: number): string => signedFormatter.format(kr);

/** "91,20", "91.20" or "1 400" become a number of kronor. Returns null when the text isn't an amount. */
export function parseKr(input: string): number | null {
  const cleaned = input.replace(/[\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned);
}

export const MONEY_OUT_IS_NEGATIVE = true;

/** The amount to send to the backend for a plain number the user typed. */
export const toBackendAmount = (kr: number, direction: MoneyDirection): number =>
  (direction === "out") === MONEY_OUT_IS_NEGATIVE ? -kr : kr;

/** Turns an amount stored by the backend into a money flow: negative = money out, positive = money in. */
export const toMoneyFlow = (stored: number): number => (MONEY_OUT_IS_NEGATIVE ? stored : -stored);

/** Adds amounts in öre, so decimals like 0.1 + 0.2 don't drift. */
export const sumKr = (amounts: number[]): number => amounts.reduce((sum, kr) => sum + Math.round(kr * 100), 0) / 100;
