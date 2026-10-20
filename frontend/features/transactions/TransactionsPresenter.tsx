"use client";

import { useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import { categoryLook } from "@/lib/categoryColors";
import { currentMonth } from "@/lib/format";
import { ordinal } from "@/lib/monthly";
import { sumKr, toMoneyFlow } from "@/lib/money";
import { applyFilters, isFiltered, netSummary } from "@/lib/transactions";
import { useCategories } from "@/models/useCategories";
import { useTags } from "@/models/useTags";
import { useCurrentPlan } from "@/models/usePlans";
import { useGoals } from "@/models/useGoals";
import { useMonthlyPayments, useStopMonthlyPayment } from "@/models/useMonthlyPayments";
import { useDeleteTransaction, useMonthTransactions } from "@/models/useTransactions";
import type { CategoryWithSubcategories } from "@/types/category";
import type { SavingsGoal } from "@/types/goal";
import type { MonthlyPayment, MonthlyPaymentRow } from "@/types/monthlyPayment";
import { DEFAULT_FILTERS, type Transaction, type TransactionFilters, type TransactionRow } from "@/types/transaction";
import TransactionFiltersPresenter from "./filters/TransactionFiltersPresenter";
import TransactionFormPresenter from "./form/TransactionFormPresenter";
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
    const look = categoryLook(categories, transaction.categoryId);
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
      // Savings have no category: a goal icon in the plum of the palette instead of a letter
      tint: isSaving ? "bg-secondary/10 text-secondary" : look.tint,
      stripe: isSaving ? "bg-secondary" : look.stripe,
      initial: isSaving ? null : look.initial,
      categoryId: transaction.categoryId ?? null,
      monthlyPaymentId: transaction.monthlyPaymentId ?? null,
      tags: transaction.tags,
    };
  });
}

/** The backend sends category ids only, so the names are looked up here too. */
function toPaymentRows(payments: MonthlyPayment[], categories: CategoryWithSubcategories[]): MonthlyPaymentRow[] {
  return payments.map((payment) => {
    const category = categories.find((c) => c.id === payment.categoryId);
    const subcategory = category?.subcategories.find((s) => s.id === payment.subcategoryId);
    const look = categoryLook(categories, payment.categoryId);
    return {
      id: payment.id,
      ink: look.ink,
      initial: look.initial,
      title: payment.description ?? subcategory?.name ?? category?.name ?? "Monthly payment",
      detail: [category?.name, subcategory?.name, `monthly on the ${ordinal(payment.dayOfMonth)}`]
        .filter(Boolean)
        .join(" · "),
      amount: toMoneyFlow(payment.amount),
      nextCharge: payment.nextCharge,
      tags: payment.tags,
    };
  });
}

// The list starts with the most recent transactions, and "Show more" adds more
const FIRST_PAGE = 5;
const NEXT_PAGE = 10;

export default function TransactionsPresenter() {
  const [month, setMonth] = useState(currentMonth);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [pendingDelete, setPendingDelete] = useState<TransactionRow | null>(null);
  const [pendingStop, setPendingStop] = useState<MonthlyPaymentRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(FIRST_PAGE);

  const plan = useCurrentPlan();
  const planId = plan.data?.id;
  const categories = useCategories(planId);
  const tags = useTags();
  const expenses = useMonthTransactions(planId, month);
  const goals = useGoals(planId);
  const deleteTransaction = useDeleteTransaction();
  const monthlyPayments = useMonthlyPayments(planId);
  const stopPayment = useStopMonthlyPayment();

  const allRows = useMemo(
    () => (expenses.data ? toRows(expenses.data, categories.data ?? [], goals.data ?? []) : null),
    [expenses.data, categories.data, goals.data],
  );
  const rows = useMemo(
    () => (allRows ? applyFilters(allRows, filters, tags.data) : null),
    [allRows, filters, tags.data],
  );
  const visibleRows = rows ? rows.slice(0, visibleCount) : null;
  // "Show more" says how many more it adds, which is fewer than a full page at the end
  const hiddenCount = rows && visibleRows ? rows.length - visibleRows.length : 0;
  const showMoreCount = Math.min(NEXT_PAGE, hiddenCount);
  const paymentRows = useMemo(
    () => (monthlyPayments.data ? toPaymentRows(monthlyPayments.data, categories.data ?? []) : []),
    [monthlyPayments.data, categories.data],
  );
  // Money in minus money out for the whole month, whatever the filters are set to. Savings aren't spending
  const net = expenses.data
    ? sumKr(
        expenses.data
          .filter((transaction) => transaction.type === "EXPENSE")
          .map((transaction) => toMoneyFlow(transaction.amount)),
      )
    : null;

  const noPlanYet = plan.error instanceof ApiError && plan.error.status === 404;
  const loadError = noPlanYet
    ? "Create a budget plan first."
    : (plan.error ?? categories.error ?? expenses.error)?.message;
  // "Try again" is only for a failed load. Action errors, and "create a plan first", need something else.
  const retryLoad = () => {
    if (plan.error) plan.refetch();
    if (categories.error) categories.refetch();
    if (expenses.error) expenses.refetch();
  };

  /** stopRepeating: also stop the monthly payment that made the transaction, so no more are created. */
  function confirmDelete(stopRepeating: boolean) {
    if (!pendingDelete) return;
    deleteTransaction.mutate(
      { id: pendingDelete.id, stopRepeating },
      {
        onSuccess: () => {
          setActionError(null);
          setPendingDelete(null);
        },
        onError: (error) => {
          setActionError(error.message);
          setPendingDelete(null);
        },
      },
    );
  }

  function confirmStop() {
    if (!pendingStop) return;
    stopPayment.mutate(pendingStop.id, {
      onSuccess: () => {
        setActionError(null);
        setPendingStop(null);
      },
      onError: (error) => {
        setActionError(error.message);
        setPendingStop(null);
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
      netSummary={netSummary(net)}
      filters={
        <TransactionFiltersPresenter
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setVisibleCount(FIRST_PAGE);
          }}
          categories={categories.data ?? []}
          tags={tags.data ?? []}
        />
      }
      isFiltered={isFiltered(filters)}
      monthlyPayments={paymentRows}
      rows={visibleRows}
      matchCount={rows?.length ?? 0}
      hiddenCount={hiddenCount}
      showMoreCount={showMoreCount}
      onShowMore={() => setVisibleCount((count) => count + NEXT_PAGE)}
      isRefreshing={expenses.isPlaceholderData}
      errorMessage={actionError ?? loadError ?? null}
      onRetry={actionError || noPlanYet || !loadError ? undefined : retryLoad}
      pendingDelete={pendingDelete}
      pendingStop={pendingStop}
      onMonthChange={(next) => {
        setMonth(next);
        setVisibleCount(FIRST_PAGE);
      }}
      onAskDelete={setPendingDelete}
      onConfirmDelete={confirmDelete}
      onAskStop={setPendingStop}
      onConfirmStop={confirmStop}
      onCancelDialog={() => {
        setPendingDelete(null);
        setPendingStop(null);
      }}
    />
  );
}
