import { sumKr } from "@/lib/money";
import type { CategorySpending } from "@/types/overview";

/** One category's slice of total spending, ready to draw as a donut slice and a list row. */
export type CategorySegment = {
  categoryId: string;
  name: string;
  spent: number;
  percent: number;
  color: string;
};

export const CATEGORY_PALETTE = [
  "#2563eb", // cobalt / primary
  "#8b4a80", // plum / secondary
  "#b6174b", // crimson / accent
  "#047857", // emerald / success
  "#b45309", // amber / warning
  "#5b5870", // slate / muted
] as const;

/** Synthetic id for the "spent in this category but in no subcategory" remainder row. */
export const UNCATEGORIZED_ID = "__uncategorized__";

/** A stable palette color for the nth segment, cycling once the palette runs out. */
export const categoryColor = (index: number): string => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

const roundToTenth = (value: number): number => Math.round(value * 10) / 10;

const clampByte = (value: number): number => Math.min(255, Math.max(0, Math.round(value)));

const toHex = (value: number): string => clampByte(value).toString(16).padStart(2, "0");

/**
 * Blends a hex color toward white by `amount` (0 = unchanged, 1 = white).
 * Used to give subcategories lighter shades of their parent's color.
 */
export function shade(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (channel: number) => channel + (255 - channel) * amount;
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

/**
 * Turns a plan's categories into spending segments: drops anything not actually spent,
 * sorts biggest first, and gives each a share of the total plus a stable color.
 */
export function toSpendingSegments(categories: CategorySpending[]): CategorySegment[] {
  const spending = categories.filter((category) => category.spent > 0).sort((a, b) => b.spent - a.spent);

  const total = sumKr(spending.map((category) => category.spent));
  if (total <= 0) return [];

  return spending.map((category, index) => ({
    categoryId: category.categoryId,
    name: category.name,
    spent: category.spent,
    percent: roundToTenth((category.spent / total) * 100),
    color: categoryColor(index),
  }));
}

// Spending under 1 cent is treated as rounding noise, not a real remainder.
const REMAINDER_EPSILON = 0.005;

// How much each successive subcategory shade is lightened toward white.
const SHADE_STEP = 0.14;
const SHADE_MAX = 0.7;

/**
 * Breaks one category down into its subcategories, sized against the parent's own spend
 * (percent-of-parent). Drops unspent subcategories, sorts biggest first, and appends an
 * "Uncategorized" remainder when the category was spent on outside any subcategory, so the
 * children always reconcile to the parent total. Colors are lighter shades of `parentColor`.
 */
export function toSubcategorySegments(category: CategorySpending, parentColor: string): CategorySegment[] {
  const total = category.spent;
  if (total <= 0) return [];

  const spending = category.subcategories
    .filter((subcategory) => subcategory.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const remainder = sumKr([total, ...spending.map((subcategory) => -subcategory.spent)]);

  const children: CategorySegment[] = spending.map((subcategory, index) => ({
    categoryId: subcategory.subcategoryId,
    name: subcategory.name,
    spent: subcategory.spent,
    percent: roundToTenth((subcategory.spent / total) * 100),
    color: shade(parentColor, Math.min(index * SHADE_STEP, SHADE_MAX)),
  }));

  if (remainder > REMAINDER_EPSILON) {
    children.push({
      categoryId: UNCATEGORIZED_ID,
      name: "Uncategorized",
      spent: remainder,
      percent: roundToTenth((remainder / total) * 100),
      color: shade(parentColor, SHADE_MAX),
    });
  }

  return children;
}

/**
 * Flattens every category's subcategories into one list of segments for the "Subcategories"
 * view: each subcategory keeps a shade of its parent category's color (so you can still read
 * which group it belongs to), unattributed spend becomes a per-category "… · Uncategorized"
 * slice so the pie reconciles to the real total, percentages are of the grand total, and the
 * whole set is sorted worst-to-least.
 */
export function toAllSubcategorySegments(categories: CategorySpending[]): CategorySegment[] {
  // Base the parent colors on the same ordering the category view uses, so a subcategory's
  // hue matches its category's slice.
  const categoryColors = new Map(toSpendingSegments(categories).map((segment) => [segment.categoryId, segment.color]));

  const flattened = categories.flatMap((category) => {
    const parentColor = categoryColors.get(category.categoryId);
    if (!parentColor) return [];

    return toSubcategorySegments(category, parentColor).map((child) =>
      child.categoryId === UNCATEGORIZED_ID
        ? {
            ...child,
            // Make the synthetic id unique per category and attribute the name.
            categoryId: `${category.categoryId}:${UNCATEGORIZED_ID}`,
            name: `${category.name} · Uncategorized`,
          }
        : child,
    );
  });

  const total = sumKr(flattened.map((segment) => segment.spent));
  if (total <= 0) return [];

  return flattened
    .map((segment) => ({ ...segment, percent: roundToTenth((segment.spent / total) * 100) }))
    .sort((a, b) => b.spent - a.spent);
}
