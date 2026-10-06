// Money is whole öre everywhere except what the user sees and types: 9120 öre = "91,20 kr"

export const MIN_AMOUNT_ORE = 100; // 1 kr
export const MAX_AMOUNT_ORE = 100_000_000; // 1 000 000 kr

const formatter = new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" });

export const formatOre = (ore: number): string => formatter.format(ore / 100);

/** "91,20", "91.20" or "1 400" become öre. Returns null when the text isn't an amount. */
export function parseKronorToOre(input: string): number | null {
  const cleaned = input.replace(/[\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [kronor, ore = ""] = cleaned.split(".");
  // Integer math only, so there are no rounding errors
  return Number(kronor) * 100 + Number(ore.padEnd(2, "0"));
}
