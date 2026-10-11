// types/transaction.ts: matches what the backend sends for transactions

export type TransactionType = "EXPENSE" | "SAVING";

/** Whether money leaves ("out") or comes into ("in") the budget. See MONEY_OUT_IS_NEGATIVE in lib/money.ts. */
export type MoneyDirection = "out" | "in";

export type Transaction = {
  id: string;
  amount: number; // kronor, with decimals (91.2 = 91,20 kr)
  date: string; // "YYYY-MM-DD"
  description?: string;
  type: TransactionType;
  categoryId?: string;
  subcategoryId?: string;
  savingsGoalId?: string;
};

/** What the page sends when it logs an expense. The backend requires a category for expenses. */
export type NewTransaction = {
  amount: number; // kronor
  date: string;
  description?: string;
  type: "EXPENSE";
  categoryId: string;
  subcategoryId?: string;
};

/** A transaction with its category names filled in, ready to show in the list. */
export type TransactionRow = {
  id: string;
  amount: number; // money flow in kronor: negative = money out, positive = money in
  date: string;
  description: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
  categoryId: string | null;
};

/** What the search and filter controls hold. They narrow down the month that was loaded. */
export type TransactionFilters = {
  q: string;
  categoryId: string;
  minKr: string;
  maxKr: string;
  sort: "date" | "amount";
  dir: "asc" | "desc";
};

export const DEFAULT_FILTERS: TransactionFilters = {
  q: "",
  categoryId: "",
  minKr: "",
  maxKr: "",
  sort: "date",
  dir: "desc",
};
