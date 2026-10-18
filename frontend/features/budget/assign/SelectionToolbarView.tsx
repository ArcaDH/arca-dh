import type { FC } from "react";
import { AlertTriangle, Target, X } from "lucide-react";
import Button from "@/components/ui/button";

interface SelectionToolbarViewProps {
  count: number;
  // How many of the selected lines are overspent, so we only show "Cover" when relevant.
  overspentCount: number;
  amount: string;
  error: string | null;
  isAssigning: boolean;
  isFunding: boolean;
  isCovering: boolean;
  onAmountChange: (amount: string) => void;
  onAssign: () => void;
  onFundTargets: () => void;
  onCoverOverspending: () => void;
  onClear: () => void;
}

// Appears above the table when subcategory lines are checked, for bulk actions on the selection.
export const SelectionToolbarView: FC<SelectionToolbarViewProps> = ({
  count,
  overspentCount,
  amount,
  error,
  isAssigning,
  isFunding,
  isCovering,
  onAmountChange,
  onAssign,
  onFundTargets,
  onCoverOverspending,
  onClear,
}) => {
  const busy = isAssigning || isFunding || isCovering;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-sm border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <span className="font-medium text-primary">{count} selected</span>

      <div className="h-4 w-px bg-foreground/15" aria-hidden />

      <Button
        size="sm"
        variant="soft"
        onClick={onFundTargets}
        disabled={busy}
        aria-label="Fund targets of selected categories"
      >
        <Target size={14} strokeWidth={2} aria-hidden />
        {isFunding ? "Funding…" : "Fund targets"}
      </Button>

      {overspentCount > 0 && (
        <Button
          size="sm"
          variant="soft"
          onClick={onCoverOverspending}
          disabled={busy}
          aria-label="Cover overspending in selected categories"
        >
          <AlertTriangle size={14} strokeWidth={2} aria-hidden />
          {isCovering ? "Covering…" : `Cover overspending (${overspentCount})`}
        </Button>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onAssign();
        }}
      >
        <span className="relative">
          <input
            inputMode="decimal"
            placeholder="0"
            value={amount}
            aria-label="Amount to assign to each selected category"
            onChange={(event) => onAmountChange(event.target.value)}
            className="w-28 rounded-sm border border-foreground/20 bg-white py-1 pr-8 pl-2 text-right font-semibold tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted">kr</span>
        </span>
        <Button size="sm" type="submit" disabled={busy}>
          {isAssigning ? "Assigning…" : "Assign to each"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-xs text-accent">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        className="ml-auto flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-1 text-muted hover:bg-foreground/5 hover:text-foreground"
      >
        <X size={14} aria-hidden />
        Clear
      </button>
    </div>
  );
};
