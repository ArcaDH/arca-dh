import { api } from "./api";
import { parseKronorToOre } from "./money";

export const TAG_COLORS = [
  "teal",
  "mauve",
  "crimson",
  "midnight",
  "charcoal",
  "amber",
  "orange",
  "emerald",
  "violet",
  "pink",
] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export const MAX_TAGS_PER_TRANSACTION = 5;
export const MAX_TAG_NAME_LENGTH = 30;

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

export interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export interface Transaction {
  id: string;
  amount: number; // öre
  date: string;
  description: string | null;
  type: "EXPENSE" | "INCOME";
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  tags: Tag[];
  recurringId: string | null;
}

export interface MonthlyPayment {
  id: string;
  description: string | null;
  amount: number; // öre
  dayOfMonth: number;
  nextCharge: string;
  category: { id: string; name: string } | null;
}

/** What the search and filter controls hold. The month is kept separately by the page. */
export interface TransactionFilters {
  q: string;
  categoryId: string;
  tagIds: string[];
  tagMode: "any" | "all";
  minKr: string;
  maxKr: string;
  sort: "date" | "amount";
  dir: "asc" | "desc";
}

export const DEFAULT_FILTERS: TransactionFilters = {
  q: "",
  categoryId: "",
  tagIds: [],
  tagMode: "any",
  minKr: "",
  maxKr: "",
  sort: "date",
  dir: "desc",
};

export interface NewTransaction {
  amount: number; // öre
  date: string;
  description?: string;
  categoryId: string | null;
  subcategoryId: string | null;
  tagIds: string[];
  repeatMonthly?: { dayOfMonth: number };
}

function monthRange(month: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export function listTransactions(month: string, filters: TransactionFilters, limit: number) {
  const params = new URLSearchParams({
    ...monthRange(month),
    sort: filters.sort,
    dir: filters.dir,
    limit: String(limit),
  });
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.tagIds.length > 0) {
    params.set("tagIds", filters.tagIds.join(","));
    params.set("tagMode", filters.tagMode);
  }
  const min = parseKronorToOre(filters.minKr);
  const max = parseKronorToOre(filters.maxKr);
  if (min !== null) params.set("minAmount", String(min));
  if (max !== null) params.set("maxAmount", String(max));
  return api<{ items: Transaction[]; hasMore: boolean }>(`/transactions?${params}`);
}

export const getMonthTotal = (month: string) =>
  api<{ month: string; total: number }>(`/transactions/summary?month=${month}`);

export const getFormOptions = () => api<{ categories: Category[]; tags: Tag[] }>("/transactions/form-options");

export const createTransaction = (body: NewTransaction) =>
  api<Transaction>("/transactions", { method: "POST", body: JSON.stringify(body) });

export const deleteTransaction = (id: string, stopRecurring: boolean) =>
  api<void>(`/transactions/${id}?stopRecurring=${stopRecurring}`, { method: "DELETE" });

export const createTag = (body: { name: string; color: TagColor }) =>
  api<Tag>("/tags", { method: "POST", body: JSON.stringify(body) });

export const listMonthlyPayments = () => api<MonthlyPayment[]>("/recurring");

export const stopMonthlyPayment = (id: string) => api<void>(`/recurring/${id}/stop`, { method: "POST" });
