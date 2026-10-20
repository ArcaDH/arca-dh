import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import MonthlyPayments from "@/features/transactions/components/MonthlyPayments";
import TransactionFiltersBar from "@/features/transactions/components/TransactionFilters";
import TransactionList from "@/features/transactions/components/TransactionList";
import TransactionListSkeleton from "@/features/transactions/components/TransactionListSkeleton";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { formatDay } from "@/lib/format";
import { formatSignedKr, formatWholeKr } from "@/lib/money";
import type { MonthlyPaymentRow } from "@/types/monthlyPayment";
import type { Tag } from "@/types/tag";
import type { TransactionFilters, TransactionRow } from "@/types/transaction";

// How many more rows "Show more" adds, so the button can say so
const SHOW_MORE_STEP = 10;

interface TransactionsViewProps {
  /** The "new transaction" form. Empty until the plan and its categories have loaded. */
  form: ReactNode;
  month: string;
  /** Money in minus money out for the month, in kronor: negative when more went out than came in. */
  net: number | null;
  filters: TransactionFilters;
  isFiltered: boolean;
  categories: { id: string; name: string }[];
  tags: Tag[];
  /** The active monthly payments, shown in their own card. */
  monthlyPayments: MonthlyPaymentRow[];
  /** The rows that are shown. null until the first load has finished. */
  rows: TransactionRow[] | null;
  /** How many transactions match the filters, shown or not. */
  matchCount: number;
  isRefreshing: boolean;
  errorMessage: string | null;
  /** Set when the failure is a load that can be tried again. */
  onRetry?: () => void;
  pendingDelete: TransactionRow | null;
  pendingStop: MonthlyPaymentRow | null;
  onMonthChange: (month: string) => void;
  onFiltersChange: (filters: TransactionFilters) => void;
  onShowMore: () => void;
  onAskDelete: (row: TransactionRow) => void;
  /** stopRepeating: also stop the monthly payment that made the transaction. */
  onConfirmDelete: (stopRepeating: boolean) => void;
  onAskStop: (payment: MonthlyPaymentRow) => void;
  onConfirmStop: () => void;
  onCancelDialog: () => void;
}

export default function TransactionsView(props: TransactionsViewProps) {
  const { pendingDelete, pendingStop, net } = props;
  const hiddenCount = props.rows ? props.matchCount - props.rows.length : 0;

  return (
    <div>
      <PageHeader
        aside={
          <dl className="flex items-baseline gap-1.5 text-sm">
            <dt className="text-muted">{net !== null && net > 0 ? "Received" : "Spent"}</dt>
            <dd className="font-medium tabular-nums">{net !== null ? formatWholeKr(Math.abs(net)) : "–"}</dd>
          </dl>
        }
      >
        <h1 className="text-lg font-semibold">Transactions</h1>
        <MonthPicker month={props.month} onChange={props.onMonthChange} />
      </PageHeader>

      {props.errorMessage && <ErrorState message={props.errorMessage} onRetry={props.onRetry} />}

      {/* Three columns on wide screens, two on large ones (the monthly payments go under the form), one on small */}
      <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <div className="xl:col-start-1 xl:row-start-1">{props.form}</div>

        <section aria-label="Transaction list" className="xl:col-start-2 xl:row-span-2 xl:row-start-1 2xl:row-span-1">
          <Card>
            <div className="mb-3">
              <TransactionFiltersBar
                filters={props.filters}
                onChange={props.onFiltersChange}
                categories={props.categories}
                tags={props.tags}
              />
            </div>

            {props.rows ? (
              <TransactionList
                rows={props.rows}
                isRefreshing={props.isRefreshing}
                isFiltered={props.isFiltered}
                onDelete={props.onAskDelete}
              />
            ) : (
              !props.errorMessage && <TransactionListSkeleton />
            )}

            {hiddenCount > 0 && props.rows && (
              <div className="mt-2 border-t border-foreground/10 pt-3 text-center">
                <button
                  type="button"
                  onClick={props.onShowMore}
                  className="cursor-pointer rounded-full border border-primary px-3.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  Show {Math.min(SHOW_MORE_STEP, hiddenCount)} more
                </button>
                <p className="mt-1 text-xs text-foreground/60">
                  Showing {props.rows.length} of {props.matchCount}
                </p>
              </div>
            )}
          </Card>
        </section>

        <div className="xl:col-start-1 xl:row-start-2 2xl:col-start-3 2xl:row-start-1">
          <MonthlyPayments payments={props.monthlyPayments} onStop={props.onAskStop} />
        </div>
      </div>

      {pendingDelete && !pendingDelete.monthlyPaymentId && (
        <ConfirmDialog
          title="Delete this transaction?"
          onCancel={props.onCancelDialog}
          actions={[{ label: "Delete", danger: true, onClick: () => props.onConfirmDelete(false) }]}
        >
          &quot;{pendingDelete.title}
          &quot;, {formatSignedKr(pendingDelete.amount)} on {formatDay(pendingDelete.date)}, will be removed. This
          can&apos;t be undone.
        </ConfirmDialog>
      )}

      {pendingDelete && pendingDelete.monthlyPaymentId && (
        <ConfirmDialog
          title="Delete a monthly payment?"
          onCancel={props.onCancelDialog}
          actions={[
            { label: "Only this month", onClick: () => props.onConfirmDelete(false) },
            { label: "Delete and stop repeating", danger: true, onClick: () => props.onConfirmDelete(true) },
          ]}
        >
          &quot;{pendingDelete.title}
          &quot;, {formatSignedKr(pendingDelete.amount)} on {formatDay(pendingDelete.date)}, repeats every month. Delete
          only this month&apos;s, or delete it and stop it repeating? Next month&apos;s is still created if you only
          delete this one. Past transactions are kept either way.
        </ConfirmDialog>
      )}

      {pendingStop && (
        <ConfirmDialog
          title={`Stop ${pendingStop.title}?`}
          onCancel={props.onCancelDialog}
          actions={[{ label: "Stop repeating", danger: true, onClick: props.onConfirmStop }]}
        >
          No more transactions are created for it. The ones already made are kept.
        </ConfirmDialog>
      )}
    </div>
  );
}
