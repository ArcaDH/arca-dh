import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import MonthlyPayments from "@/components/transactions/MonthlyPayments";
import TransactionFiltersBar from "@/components/transactions/TransactionFilters";
import TransactionList from "@/components/transactions/TransactionList";
import ConfirmDialog from "@/components/ui/transactions/ConfirmDialog";
import { cardClass, iconButtonClass } from "@/components/ui/transactions/styles";
import { formatDay, monthLabel } from "@/lib/format";
import { formatOre } from "@/lib/money";
import type { Category, MonthlyPayment, Tag, Transaction, TransactionFilters } from "@/types/transaction";

interface TransactionsViewProps {
  /** The "new transaction" form. Empty until the categories have loaded. */
  form: ReactNode;
  month: string;
  /** Total spent in the month, in öre. */
  total: number | null;
  filters: TransactionFilters;
  isFiltered: boolean;
  categories: Category[];
  tags: Tag[];
  /** null until the first load has finished. */
  transactions: Transaction[] | null;
  isRefreshing: boolean;
  hasMore: boolean;
  payments: MonthlyPayment[];
  errorMessage: string | null;
  pendingDelete: Transaction | null;
  pendingStop: MonthlyPayment | null;
  onMonthChange: (delta: number) => void;
  onFiltersChange: (filters: TransactionFilters) => void;
  onLoadMore: () => void;
  onAskDelete: (transaction: Transaction) => void;
  onAskStop: (payment: MonthlyPayment) => void;
  onConfirmDelete: (stopRecurring: boolean) => void;
  onConfirmStop: () => void;
  onCancelDialog: () => void;
}

export default function TransactionsView(props: TransactionsViewProps) {
  const { pendingDelete, pendingStop } = props;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 font-heading text-2xl font-bold">Transactions</h1>

      {props.errorMessage && (
        <p role="alert" className="mb-4 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
          {props.errorMessage}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {props.form}
          <MonthlyPayments payments={props.payments} onStop={props.onAskStop} />
        </div>

        <section className={cardClass} aria-label="Transaction list">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => props.onMonthChange(-1)}
                aria-label="Previous month"
                className={iconButtonClass}
              >
                <ChevronLeft size={18} aria-hidden />
              </button>
              <h2 className="min-w-44 text-center font-heading text-xl font-semibold">{monthLabel(props.month)}</h2>
              <button
                type="button"
                onClick={() => props.onMonthChange(1)}
                aria-label="Next month"
                className={iconButtonClass}
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg">{props.total !== null ? formatOre(props.total) : "–"}</p>
              <p className="text-xs text-foreground/60">spent this month</p>
            </div>
          </div>

          <div className="mb-3">
            <TransactionFiltersBar
              filters={props.filters}
              onChange={props.onFiltersChange}
              categories={props.categories}
              tags={props.tags}
            />
          </div>

          {props.transactions ? (
            <TransactionList
              items={props.transactions}
              isRefreshing={props.isRefreshing}
              hasMore={props.hasMore}
              isFiltered={props.isFiltered}
              onLoadMore={props.onLoadMore}
              onDelete={props.onAskDelete}
            />
          ) : (
            !props.errorMessage && <p className="py-8 text-center text-sm text-foreground/60">Loading…</p>
          )}
        </section>
      </div>

      {pendingDelete && !pendingDelete.recurringId && (
        <ConfirmDialog
          title="Delete this transaction?"
          onCancel={props.onCancelDialog}
          actions={[{ label: "Delete", danger: true, onClick: () => props.onConfirmDelete(false) }]}
        >
          &quot;{pendingDelete.description ?? "Transaction"}&quot;, {formatOre(pendingDelete.amount)} on{" "}
          {formatDay(pendingDelete.date)}, will be removed. This can&apos;t be undone.
        </ConfirmDialog>
      )}

      {pendingDelete?.recurringId && (
        <ConfirmDialog
          title="Delete a monthly payment?"
          onCancel={props.onCancelDialog}
          actions={[
            { label: "Only this month", danger: true, onClick: () => props.onConfirmDelete(false) },
            { label: "Delete and stop repeating", danger: true, onClick: () => props.onConfirmDelete(true) },
          ]}
        >
          This transaction repeats every month. You can delete just this one, or delete it and stop it from repeating.
          Earlier months stay in your history either way.
        </ConfirmDialog>
      )}

      {pendingStop && (
        <ConfirmDialog
          title={`Stop repeating ${pendingStop.description ?? "this payment"}?`}
          onCancel={props.onCancelDialog}
          actions={[{ label: "Stop repeating", danger: true, onClick: props.onConfirmStop }]}
        >
          No new transactions will be added for it. The ones already in your history stay.
        </ConfirmDialog>
      )}
    </div>
  );
}
