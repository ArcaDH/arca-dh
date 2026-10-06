"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import MonthlyPayments from "@/components/transactions/MonthlyPayments";
import TransactionFiltersBar from "@/components/transactions/TransactionFilters";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionList from "@/components/transactions/TransactionList";
import ConfirmDialog from "@/components/ui/transactions/ConfirmDialog";
import { cardClass, ghostButtonClass } from "@/components/ui/transactions/styles";
import { currentMonth, formatDay, monthLabel, shiftMonth } from "@/lib/format";
import { formatOre } from "@/lib/money";
import {
  DEFAULT_FILTERS,
  deleteTransaction,
  getFormOptions,
  getMonthTotal,
  listMonthlyPayments,
  listTransactions,
  stopMonthlyPayment,
  type MonthlyPayment,
  type Transaction,
  type TransactionFilters,
} from "@/lib/transactions";
import { useDebounced } from "@/lib/useDebounced";
import { useQuery } from "@/lib/useQuery";

const PAGE_SIZE = 25;

export default function TransactionPage() {
  const [month, setMonth] = useState(currentMonth);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [pages, setPages] = useState(1);
  // Bumping this reloads everything on the page
  const [reload, setReload] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [pendingStop, setPendingStop] = useState<MonthlyPayment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // The search text is only sent once typing has paused
  const debouncedQ = useDebounced(filters.q);
  const activeFilters = { ...filters, q: debouncedQ };

  const options = useQuery(`options:${reload}`, getFormOptions);
  const payments = useQuery(`payments:${reload}`, listMonthlyPayments);
  const total = useQuery(`total:${month}:${reload}`, () => getMonthTotal(month));
  const list = useQuery(JSON.stringify([month, activeFilters, pages, reload]), () =>
    listTransactions(month, activeFilters, pages * PAGE_SIZE),
  );

  const refresh = () => setReload((n) => n + 1);
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

  async function run(action: () => Promise<void>) {
    try {
      await action();
      setActionError(null);
      refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    }
    setPendingDelete(null);
    setPendingStop(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 font-heading text-2xl font-bold">Transactions</h1>

      {(loadError || actionError) && (
        <p role="alert" className="mb-4 rounded-lg bg-crimson/10 px-4 py-3 text-sm text-crimson">
          {loadError?.status === 401 ? "Log in to see your transactions." : (actionError ?? loadError?.message)}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {options.data && (
            <TransactionForm
              categories={options.data.categories}
              tags={options.data.tags}
              onSaved={refresh}
              onTagCreated={refresh}
            />
          )}
          <MonthlyPayments payments={payments.data ?? []} onStop={setPendingStop} />
        </div>

        <section className={cardClass} aria-label="Transaction list">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className={ghostButtonClass}
              >
                <ChevronLeft size={18} aria-hidden />
              </button>
              <h2 className="min-w-44 text-center font-heading text-xl font-semibold">{monthLabel(month)}</h2>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className={ghostButtonClass}>
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg">{total.data ? formatOre(total.data.total) : "–"}</p>
              <p className="text-xs text-foreground/60">spent this month</p>
            </div>
          </div>

          <div className="mb-3">
            <TransactionFiltersBar
              filters={filters}
              onChange={changeFilters}
              categories={options.data?.categories ?? []}
              tags={options.data?.tags ?? []}
            />
          </div>

          {list.data ? (
            <TransactionList
              items={list.data.items}
              loading={list.loading}
              hasMore={list.data.hasMore}
              isFiltered={isFiltered}
              onLoadMore={() => setPages((n) => n + 1)}
              onDelete={setPendingDelete}
            />
          ) : (
            !list.error && <p className="py-8 text-center text-sm text-foreground/60">Loading…</p>
          )}
        </section>
      </div>

      {pendingDelete && !pendingDelete.recurringId && (
        <ConfirmDialog
          title="Delete this transaction?"
          onCancel={() => setPendingDelete(null)}
          actions={[
            { label: "Delete", danger: true, onClick: () => run(() => deleteTransaction(pendingDelete.id, false)) },
          ]}
        >
          &quot;{pendingDelete.description ?? "Transaction"}&quot;, {formatOre(pendingDelete.amount)} on{" "}
          {formatDay(pendingDelete.date)}, will be removed. This can&apos;t be undone.
        </ConfirmDialog>
      )}

      {pendingDelete?.recurringId && (
        <ConfirmDialog
          title="Delete a monthly payment?"
          onCancel={() => setPendingDelete(null)}
          actions={[
            {
              label: "Only this month",
              danger: true,
              onClick: () => run(() => deleteTransaction(pendingDelete.id, false)),
            },
            {
              label: "Delete and stop repeating",
              danger: true,
              onClick: () => run(() => deleteTransaction(pendingDelete.id, true)),
            },
          ]}
        >
          This transaction repeats every month. You can delete just this one, or delete it and stop it from repeating.
          Earlier months stay in your history either way.
        </ConfirmDialog>
      )}

      {pendingStop && (
        <ConfirmDialog
          title={`Stop repeating ${pendingStop.description ?? "this payment"}?`}
          onCancel={() => setPendingStop(null)}
          actions={[
            { label: "Stop repeating", danger: true, onClick: () => run(() => stopMonthlyPayment(pendingStop.id)) },
          ]}
        >
          No new transactions will be added for it. The ones already in your history stay.
        </ConfirmDialog>
      )}
    </div>
  );
}
