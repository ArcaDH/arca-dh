import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import MonthlyPayments from "@/components/transactions/MonthlyPayments";
import TransactionFiltersBar from "@/components/transactions/TransactionFilters";
import TransactionList from "@/components/transactions/TransactionList";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconButton from "@/components/ui/IconButton";
import { formatDay, monthLabel } from "@/lib/format";
import { formatKr, formatSignedKr } from "@/lib/money";
import type { MonthlyPaymentRow } from "@/types/monthlyPayment";
import type { Tag } from "@/types/tag";
import type { TransactionFilters, TransactionRow } from "@/types/transaction";

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
  /** The active monthly payments, shown in a card under the form. */
  monthlyPayments: MonthlyPaymentRow[];
  /** null until the first load has finished. */
  rows: TransactionRow[] | null;
  isRefreshing: boolean;
  errorMessage: string | null;
  pendingDelete: TransactionRow | null;
  pendingStop: MonthlyPaymentRow | null;
  onMonthChange: (delta: number) => void;
  onFiltersChange: (filters: TransactionFilters) => void;
  onAskDelete: (row: TransactionRow) => void;
  /** stopRepeating: also stop the monthly payment that made the transaction. */
  onConfirmDelete: (stopRepeating: boolean) => void;
  onAskStop: (payment: MonthlyPaymentRow) => void;
  onConfirmStop: () => void;
  onCancelDialog: () => void;
}

export default function TransactionsView(props: TransactionsViewProps) {
  const { pendingDelete, pendingStop, net } = props;

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
          <MonthlyPayments payments={props.monthlyPayments} onStop={props.onAskStop} />
        </div>

        <section aria-label="Transaction list">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <IconButton onClick={() => props.onMonthChange(-1)} aria-label="Previous month">
                  <ChevronLeft size={18} aria-hidden />
                </IconButton>
                <h2 className="min-w-44 text-center font-heading text-xl font-semibold">{monthLabel(props.month)}</h2>
                <IconButton onClick={() => props.onMonthChange(1)} aria-label="Next month">
                  <ChevronRight size={18} aria-hidden />
                </IconButton>
              </div>
              <div className="text-right">
                <p className="text-lg">{net !== null ? formatKr(Math.abs(net)) : "–"}</p>
                <p className="text-xs text-foreground/60">
                  {net !== null && net > 0 ? "received this month" : "spent this month"}
                </p>
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

            {props.rows ? (
              <TransactionList
                rows={props.rows}
                isRefreshing={props.isRefreshing}
                isFiltered={props.isFiltered}
                onDelete={props.onAskDelete}
              />
            ) : (
              !props.errorMessage && <p className="py-8 text-center text-sm text-foreground/60">Loading…</p>
            )}
          </Card>
        </section>
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
