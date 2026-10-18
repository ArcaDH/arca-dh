"use client";

import { Goal, Receipt, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import { formatDay } from "@/lib/format";
import { formatSignedKr } from "@/lib/money";
import type { TransactionRow } from "@/types/transaction";
import TagChip from "./TagChip";

// Expenses and savings look alike, apart from the icon
const kindIcon: Record<TransactionRow["kind"], { icon: ReactNode; tint: string }> = {
  expense: { icon: <Receipt size={16} aria-hidden />, tint: "bg-primary/10 text-primary" },
  saving: { icon: <Goal size={16} aria-hidden />, tint: "bg-success/10 text-success" },
};

interface TransactionListProps {
  rows: TransactionRow[];
  isRefreshing: boolean;
  isFiltered: boolean;
  onDelete: (row: TransactionRow) => void;
}

export default function TransactionList({ rows, isRefreshing, isFiltered, onDelete }: TransactionListProps) {
  if (rows.length === 0) {
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
    <ul className={isRefreshing ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {rows.map((row) => {
        const meta = [row.detail, formatDay(row.date)].filter(Boolean).join(" · ");

        return (
          <li key={row.id} className="group flex items-center gap-3 border-t border-foreground/10 py-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full ${kindIcon[row.kind].tint}`}
            >
              {kindIcon[row.kind].icon}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{row.title}</p>
              <p className="truncate text-xs text-foreground/60">{meta}</p>
              {row.tags.length > 0 && (
                <ul aria-label="Tags" className="mt-1 flex flex-wrap gap-1">
                  {row.tags.map((tag) => (
                    <li key={tag.id} className="max-w-full">
                      <TagChip tag={tag} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <span className={`w-28 shrink-0 text-right font-mono text-sm ${row.amount > 0 ? "text-success" : ""}`}>
              {formatSignedKr(row.amount)}
            </span>

            <IconButton
              onClick={() => onDelete(row)}
              aria-label={`Delete ${row.description ?? "transaction"}`}
              className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 size={15} aria-hidden />
            </IconButton>
          </li>
        );
      })}
    </ul>
  );
}
