import type { CategoryWithSubcategories } from "@/types/category";
import type { SavingsGoal } from "@/types/goal";
import { formatWholeKr, parseKr } from "@/lib/money";
import type { Tag } from "@/types/tag";
import {
  DEFAULT_FILTERS,
  type ForGroup,
  type NetSummary,
  type TransactionFilters,
  type TransactionRow,
} from "@/types/transaction";

// The form's "For" list: each category with its subcategories (or itself, when it has none), then the savings goals
export function forGroups(categories: CategoryWithSubcategories[], goals: SavingsGoal[]): ForGroup[] {
  const categoryGroups = categories.map((category) => ({
    label: category.name,
    options:
      category.subcategories.length > 0
        ? category.subcategories.map((sub) => ({
            id: sub.id,
            label: sub.name,
            target: { type: "EXPENSE" as const, categoryId: category.id, subcategoryId: sub.id },
          }))
        : [{ id: category.id, label: category.name, target: { type: "EXPENSE" as const, categoryId: category.id } }],
  }));
  const goalGroup = {
    label: "Savings goals",
    options: goals.map((goal) => ({
      id: goal.id,
      label: goal.name,
      target: { type: "SAVING" as const, savingsGoalId: goal.id },
    })),
  };
  return goals.length > 0 ? [...categoryGroups, goalGroup] : categoryGroups;
}

/** True when any search or filter control is different from its default. */
export const isFiltered = (filters: TransactionFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

/**
 * The chosen tags that still exist. A tag that was deleted after it was chosen doesn't count,
 * otherwise "all" would match nothing. Until the tags have loaded, every chosen tag counts.
 */
export const chosenTagIds = (filters: TransactionFilters, tags: Tag[] | undefined): string[] =>
  tags ? filters.tagIds.filter((id) => tags.some((tag) => tag.id === id)) : filters.tagIds;

/** The filters with a tag switched on, or off when it was already chosen. */
export const toggleTagFilter = (filters: TransactionFilters, id: string): TransactionFilters => ({
  ...filters,
  tagIds: filters.tagIds.includes(id) ? filters.tagIds.filter((tagId) => tagId !== id) : [...filters.tagIds, id],
});

/** What the sort dropdown holds, like "date:desc". */
export const sortValue = (filters: TransactionFilters): string => `${filters.sort}:${filters.dir}`;

/** The other way round: "amount:asc" becomes the sort and direction to filter by. */
export function parseSortValue(value: string): Pick<TransactionFilters, "sort" | "dir"> {
  const [sort, dir] = value.split(":") as [TransactionFilters["sort"], TransactionFilters["dir"]];
  return { sort, dir };
}

/**
 * The backend only filters by month, so search, category, amount and sort are applied here.
 * Amounts are compared by size, since money out is a negative number.
 * Tags: "any" keeps a transaction with at least one of the chosen tags, "all" one with every chosen tag.
 */
export function applyFilters(
  rows: TransactionRow[],
  filters: TransactionFilters,
  tags: Tag[] | undefined,
): TransactionRow[] {
  const query = filters.q.trim().toLowerCase();
  const min = parseKr(filters.minKr);
  const max = parseKr(filters.maxKr);
  const tagIds = chosenTagIds(filters, tags);
  const hasTag = (row: TransactionRow, id: string) => row.tags.some((tag) => tag.id === id);

  const matching = rows.filter(
    (row) =>
      (!query || (row.description ?? "").toLowerCase().includes(query)) &&
      (!filters.categoryId || row.categoryId === filters.categoryId) &&
      (tagIds.length === 0 ||
        (filters.tagMode === "all" ? tagIds.every((id) => hasTag(row, id)) : tagIds.some((id) => hasTag(row, id)))) &&
      (min === null || Math.abs(row.amount) >= min) &&
      (max === null || Math.abs(row.amount) <= max),
  );

  const direction = filters.dir === "asc" ? 1 : -1;
  return matching.sort(
    (a, b) =>
      direction * (filters.sort === "amount" ? Math.abs(a.amount) - Math.abs(b.amount) : a.date.localeCompare(b.date)),
  );
}

/** Money in minus money out for the month, as the header shows it. Received when more came in than went out. */
export const netSummary = (net: number | null): NetSummary => ({
  label: net !== null && net > 0 ? "Received" : "Spent",
  amount: net !== null ? formatWholeKr(Math.abs(net)) : "–",
});
