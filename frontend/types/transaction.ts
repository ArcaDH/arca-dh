// types/transaction.ts: matches what the backend sends for transactions

import type { Tag } from "./tag";

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
  monthlyPaymentId?: string; // set when a monthly payment made this transaction
  tags: Tag[];
};

/** What the page sends when it logs an expense. The backend requires a category for expenses. */
export type NewTransaction = {
  amount: number; // kronor
  date: string;
  description?: string;
  type: "EXPENSE";
  categoryId: string;
  subcategoryId?: string;
  tagIds?: string[];
  repeatMonthly?: { dayOfMonth: number }; // makes the expense repeat every month, money out only
};

// What the transactions page sends when money is put toward a savings goal
export type NewSaving = {
  amount: number; // kronor, always positive
  date: string;
  description?: string;
  type: "SAVING";
  savingsGoalId: string;
  tagIds?: string[];
};

// What a transaction is for, picked in the form's "For" list
export type ForTarget =
  { type: "EXPENSE"; categoryId: string; subcategoryId?: string } | { type: "SAVING"; savingsGoalId: string };

export type ForOption = { id: string; label: string; target: ForTarget };

// A heading in that list: a category with its subcategories, or the savings goals
export type ForGroup = { label: string; options: ForOption[] };

/** A transaction with its names filled in, ready to show in the list. */
export type TransactionRow = {
  id: string;
  kind: "expense" | "saving";
  amount: number; // money flow in kronor: negative = money out, positive = money in
  date: string;
  description: string | null;
  title: string; // the description, or what it was for
  tint: string; // the colors of the tile in the list, from its category
  stripe: string; // the color of the stripe along the row's edge, from its category
  initial: string | null; // the letter in the tile, null for savings (they show a goal icon)
  detail: string; // "Home · Rent" or "Savings · Trip to Japan"
  categoryId: string | null;
  monthlyPaymentId: string | null;
  tags: Tag[];
};

/** What the search and filter controls hold. They narrow down the month that was loaded. */
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

/** The month's total as the page header shows it: the label that goes with it, and the amount. */
export type NetSummary = { label: "Received" | "Spent"; amount: string };
