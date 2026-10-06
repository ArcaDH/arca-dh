// types/transaction.ts: matches what the backend sends for transactions, tags and monthly payments

export const TAG_COLORS = [
  "blue",
  "teal",
  "emerald",
  "amber",
  "orange",
  "red",
  "pink",
  "violet",
  "slate",
  "lime",
] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export const MAX_TAGS_PER_TRANSACTION = 5;
export const MAX_TAG_NAME_LENGTH = 30;

export type Tag = {
  id: string;
  name: string;
  color: TagColor;
};

export type Category = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

export type Transaction = {
  id: string;
  amount: number; // öre
  date: string;
  description: string | null;
  type: "EXPENSE" | "INCOME";
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  tags: Tag[];
  recurringId: string | null;
};

export type MonthlyPayment = {
  id: string;
  description: string | null;
  amount: number; // öre
  dayOfMonth: number;
  nextCharge: string;
  category: { id: string; name: string } | null;
};

/** What the search and filter controls hold. The month is kept separately by the page. */
export type TransactionFilters = {
  q: string;
  categoryId: string;
  tagIds: string[];
  tagMode: "any" | "all";
  minKr: string;
  maxKr: string;
  sort: "date" | "amount";
  dir: "asc" | "desc";
};

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

export type NewTransaction = {
  amount: number; // öre
  date: string;
  description?: string;
  categoryId: string | null;
  subcategoryId: string | null;
  tagIds: string[];
  repeatMonthly?: { dayOfMonth: number };
};

export type NewTag = {
  name: string;
  color: TagColor;
};
