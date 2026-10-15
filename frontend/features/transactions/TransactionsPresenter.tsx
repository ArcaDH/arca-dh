"use client";

import { useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import { currentMonth, shiftMonth } from "@/lib/format";
import { parseKr, sumKr, toMoneyFlow } from "@/lib/money";
import { useCategories } from "@/models/useCategories";
import { useTags } from "@/models/useTags";
import { useCurrentPlan } from "@/models/usePlans";
import { useGoals } from "@/models/useGoals";
import { useDeleteTransaction, useMonthTransactions } from "@/models/useTransactions";
import type { CategoryWithSubcategories } from "@/types/category";
import type { SavingsGoal } from "@/types/goal";
import type { Tag } from "@/types/tag";
import { DEFAULT_FILTERS, type Transaction, type TransactionFilters, type TransactionRow } from "@/types/transaction";
import TransactionFormPresenter from "./TransactionFormPresenter";
import TransactionsView from "./TransactionsView";

/** The backend sends category and goal ids only, so the names are looked up here. */
function toRows(
  transactions: Transaction[],
  categories: CategoryWithSubcategories[],
  goals: SavingsGoal[],
): TransactionRow[] {
  return transactions.map((transaction) => {
    const category = categories.find((c) => c.id === transaction.categoryId);
    const subcategory = category?.subcategories.find((s) => s.id === transaction.subcategoryId);
    const goal = goals.find((g) => g.id === transaction.savingsGoalId);
    const isSaving = transaction.type === "SAVING";
    const forName = isSaving ? (goal?.name ?? "Savings goal") : (subcategory?.name ?? category?.name);
    const detail = isSaving ? ["Savings", forName] : [category?.name, subcategory?.name];
    return {
      id: transaction.id,
      kind: isSaving ? "saving" : "expense",
      // Savings are stored positive, but the money leaves the account like an expense
      amount: isSaving ? -transaction.amount : toMoneyFlow(transaction.amount),
      date: transaction.date,
      description: transaction.description ?? null,
      title: transaction.description ?? forName ?? "Transaction",
      detail: detail.filter(Boolean).join(" · "),
      categoryId: transaction.categoryId ?? null,
      tags: transaction.tags,
    };
  });
}

/**
 * The backend only filters by month, so search, category, amount and sort are applied here.
 * Amounts are compared by size, since money out is a negative number.
 * Tags: "any" keeps a transaction with at least one of the chosen tags, "all" one with every chosen tag.
 * A chosen tag that has been deleted since is ignored, otherwise "all" would match nothing.
 */
function applyFilters(rows: TransactionRow[], filters: TransactionFilters, tags: Tag[] | undefined): TransactionRow[] {
  const query = filters.q.trim().toLowerCase();
  const min = parseKr(filters.minKr);
  const max = parseKr(filters.maxKr);
  const tagIds = tags ? filters.tagIds.filter((id) => tags.some((tag) => tag.id === id)) : filters.tagIds;
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

export default function TransactionsPresenter() {
  const [month, setMonth] = useState(currentMonth);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [pendingDelete, setPendingDelete] = useState<TransactionRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const plan = useCurrentPlan();
  const planId = plan.data?.id;
  const categories = useCategories(planId);
  const tags = useTags();
  const expenses = useMonthTransactions(planId, month);
  const goals = useGoals(planId);
  const deleteTransaction = useDeleteTransaction();

  const allRows = useMemo(
    () => (expenses.data ? toRows(expenses.data, categories.data ?? [], goals.data ?? []) : null),
    [expenses.data, categories.data, goals.data],
  );
  const rows = useMemo(
    () => (allRows ? applyFilters(allRows, filters, tags.data) : null),
    [allRows, filters, tags.data],
  );
  // Money in minus money out for the whole month, whatever the filters are set to. Savings aren't spending
  const net = expenses.data
    ? sumKr(
        expenses.data
          .filter((transaction) => transaction.type === "EXPENSE")
          .map((transaction) => toMoneyFlow(transaction.amount)),
      )
    : null;

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  const noPlanYet = plan.error instanceof ApiError && plan.error.status === 404;
  const loadError = noPlanYet
    ? "Create a budget plan first."
    : (plan.error ?? categories.error ?? expenses.error)?.message;

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteTransaction.mutate(pendingDelete.id, {
      onSuccess: () => {
        setActionError(null);
        setPendingDelete(null);
      },
      onError: (error) => {
        setActionError(error.message);
        setPendingDelete(null);
      },
    });
  }

  return (
    <TransactionsView
      form={
        planId && categories.data && goals.data ? (
          <TransactionFormPresenter planId={planId} categories={categories.data} goals={goals.data} />
        ) : null
      }
      month={month}
      net={net}
      filters={filters}
      isFiltered={isFiltered}
      categories={categories.data ?? []}
      tags={tags.data ?? []}
      rows={rows}
      isRefreshing={expenses.isPlaceholderData}
      errorMessage={actionError ?? loadError ?? null}
      pendingDelete={pendingDelete}
      onMonthChange={(delta) => setMonth((current) => shiftMonth(current, delta))}
      onFiltersChange={setFilters}
      onAskDelete={setPendingDelete}
      onConfirmDelete={confirmDelete}
      onCancelDialog={() => setPendingDelete(null)}
    />
  );
}
