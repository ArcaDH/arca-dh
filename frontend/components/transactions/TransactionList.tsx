"use client";

import { Receipt, Repeat, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import { iconButtonClass } from "@/components/ui/transactions/styles";
import { formatDay } from "@/lib/format";
import { formatOre } from "@/lib/money";
import type { Transaction } from "@/types/transaction";
import TagChip from "./TagChip";

interface TransactionListProps {
  items: Transaction[];
  isRefreshing: boolean;
  hasMore: boolean;
  isFiltered: boolean;
  onLoadMore: () => void;
  onDelete: (transaction: Transaction) => void;
}

export default function TransactionList({
  items,
  isRefreshing,
  hasMore,
  isFiltered,
  onLoadMore,
  onDelete,
}: TransactionListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-foreground/20 px-6 py-12 text-center">
        <p className="font-heading text-lg font-semibold">{isFiltered ? "No matches" : "Add your first transaction"}</p>
        <p className="mt-1 text-sm text-foreground/60">
          {isFiltered
            ? "Try changing or clearing the filters."
            : "Fill in the form and your transactions will show up here."}
        </p>
      </div>
    );
  }

  return (
    <div className={isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <ul>
        {items.map((transaction) => {
          const meta = [transaction.category?.name, transaction.subcategory?.name, formatDay(transaction.date)]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={transaction.id} className="group flex items-center gap-3 border-t border-foreground/10 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Receipt size={16} aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm">
                  {transaction.description ?? transaction.category?.name ?? "Transaction"}
                  {transaction.recurringId && (
                    <Repeat size={13} className="shrink-0 text-foreground/50" aria-label="Repeats monthly" />
                  )}
                </p>
                <p className="truncate text-xs text-foreground/60">{meta}</p>
              </div>

              <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                {transaction.tags.map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
              </div>

              <span className="w-28 shrink-0 text-right font-mono text-sm">{formatOre(transaction.amount)}</span>

              <button
                type="button"
                onClick={() => onDelete(transaction)}
                aria-label={`Delete ${transaction.description ?? "transaction"}`}
                className={`${iconButtonClass} shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100`}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="border-t border-foreground/10 pt-3 text-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
