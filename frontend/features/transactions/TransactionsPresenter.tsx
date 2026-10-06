"use client";

import { useState } from "react";
import { currentMonth, shiftMonth } from "@/lib/format";
import { useDebounced } from "@/lib/useDebounced";
import {
  useDeleteTransaction,
  useFormOptions,
  useMonthlyPayments,
  useMonthTotal,
  useStopMonthlyPayment,
  useTransactionList,
} from "@/models/useTransactions";
import { DEFAULT_FILTERS, type MonthlyPayment, type Transaction, type TransactionFilters } from "@/types/transaction";
import TransactionFormPresenter from "./TransactionFormPresenter";
import TransactionsView from "./TransactionsView";

const PAGE_SIZE = 25;

export default function TransactionsPresenter() {
  const [month, setMonth] = useState(currentMonth);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [pages, setPages] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [pendingStop, setPendingStop] = useState<MonthlyPayment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // The search text is only sent once typing has paused
  const debouncedQ = useDebounced(filters.q);

  const options = useFormOptions();
  const payments = useMonthlyPayments();
  const total = useMonthTotal(month);
  const list = useTransactionList(month, { ...filters, q: debouncedQ }, pages * PAGE_SIZE);
  const deleteTransaction = useDeleteTransaction();
  const stopMonthlyPayment = useStopMonthlyPayment();

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  const loadError = list.error ?? options.error;

  function changeFilters(next: TransactionFilters) {
    setFilters(next);
    setPages(1);
  }

  function changeMonth(delta: number) {
    setMonth((current) => shiftMonth(current, delta));
    setPages(1);
  }

  function closeDialogs() {
    setPendingDelete(null);
    setPendingStop(null);
  }

  const afterAction = {
    onSuccess: () => {
      setActionError(null);
      closeDialogs();
    },
    onError: (error: Error) => {
      setActionError(error.message);
      closeDialogs();
    },
  };

  function confirmDelete(stopRecurring: boolean) {
    if (pendingDelete) deleteTransaction.mutate({ id: pendingDelete.id, stopRecurring }, afterAction);
  }

  function confirmStop() {
    if (pendingStop) stopMonthlyPayment.mutate(pendingStop.id, afterAction);
  }

  return (
    <TransactionsView
      form={options.data && <TransactionFormPresenter categories={options.data.categories} tags={options.data.tags} />}
      month={month}
      total={total.data?.total ?? null}
      filters={filters}
      isFiltered={isFiltered}
      categories={options.data?.categories ?? []}
      tags={options.data?.tags ?? []}
      transactions={list.data?.items ?? null}
      isRefreshing={list.isPlaceholderData}
      hasMore={list.data?.hasMore ?? false}
      payments={payments.data ?? []}
      errorMessage={actionError ?? loadError?.message ?? null}
      pendingDelete={pendingDelete}
      pendingStop={pendingStop}
      onMonthChange={changeMonth}
      onFiltersChange={changeFilters}
      onLoadMore={() => setPages((n) => n + 1)}
      onAskDelete={setPendingDelete}
      onAskStop={setPendingStop}
      onConfirmDelete={confirmDelete}
      onConfirmStop={confirmStop}
      onCancelDialog={closeDialogs}
    />
  );
}
