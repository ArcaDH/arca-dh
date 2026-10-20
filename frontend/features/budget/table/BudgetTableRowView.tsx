import { Check, Goal, MoreHorizontal, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useRef, type FC } from "react";
import Button from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { MenuItem } from "@/components/ui/MenuItem";
import { MoneyProgress, type ProgressTone } from "@/components/ui/MoneyProgress";
import { formatWholeKr } from "@/lib/money";
import type { BudgetLine, BudgetStatus, FundingState, SubcategoryFunding } from "@/types/budget";

const statusStyle: Record<BudgetStatus, { tone: BadgeTone; variant: "solid" | "soft" }> = {
  progress: { tone: "success", variant: "soft" },
  covered: { tone: "success", variant: "solid" },
  over: { tone: "accent", variant: "soft" },
};

// Funding-bar tone per state (computed in lib/budget; the view only maps it to a colour).
const fundingTone: Record<FundingState, ProgressTone> = {
  overspent: "accent",
  funded: "success",
  funding: "primary",
  none: "primary",
};

// The inline Assigned input: Enter or leaving saves, Escape cancels
function AmountInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const cancelled = useRef(false);

  return (
    <input
      autoFocus
      onFocus={(event) => event.target.select()}
      aria-label={props.label}
      inputMode="decimal"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") cancelled.current = true;
        if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
      }}
      onBlur={() => (cancelled.current ? props.onCancel() : props.onSave())}
      className="w-28 rounded-sm border border-primary bg-white px-2 py-0.5 text-right font-normal tabular-nums ring-2 ring-primary/20 outline-none"
    />
  );
}

interface BudgetTableRowViewProps {
  name: string;
  assigned: number;
  spent: number;
  available: string;
  // A subcategory's funding bar
  funding?: SubcategoryFunding;
  // How full a goal's bar is, from 0 to 1
  progress?: number;
  // A line under a heading, with an icon and a progress bar. Left out for a heading row
  kind?: BudgetLine["kind"];
  status: BudgetStatus;
  isDone?: boolean;
  // Selection: present only on selectable rows (subcategory lines and category headings).
  selection?: {
    checked: boolean;
    indeterminate?: boolean;
    onToggle: () => void;
  };
  amountEditing?: {
    value: string | null;
    onStart: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
  };
  onAddSubcategory?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export const BudgetTableRowView: FC<BudgetTableRowViewProps> = ({
  name,
  assigned,
  spent,
  available,
  funding,
  progress = 0,
  kind,
  status,
  isDone = false,
  selection,
  amountEditing,
  onAddSubcategory,
  onRename,
  onDelete,
}) => {
  const isLine = kind !== undefined;

  return (
    <tr className={`group border-t border-foreground/10 ${isLine ? "" : "bg-foreground/[0.025] font-medium"}`}>
      <td className="w-7 py-2 pr-1 pl-1 sm:w-8 sm:pl-3">
        {selection && (
          <div className="flex">
            <Checkbox
              checked={selection.checked}
              indeterminate={selection.indeterminate}
              label={`Select ${name}`}
              onChange={selection.onToggle}
            />
          </div>
        )}
      </td>

      <td className="py-2 pr-2 pl-2 sm:pr-3">
        <div className="flex items-center gap-2.5">
          {kind === "subcategory" && (
            <Wallet size={18} strokeWidth={1.75} className="hidden shrink-0 text-muted sm:block" aria-hidden />
          )}
          {kind === "goal" && (
            <Goal
              size={18}
              strokeWidth={1.75}
              className={`hidden shrink-0 sm:block ${isDone ? "text-success" : "text-muted"}`}
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate">{name}</span>
              {onAddSubcategory && (
                <Button size="xs" variant="soft" aria-label={`Add subcategory to ${name}`} onClick={onAddSubcategory}>
                  <Plus size={12} strokeWidth={2.5} aria-hidden />
                  <span className="hidden sm:inline">Subcategory</span>
                </Button>
              )}
            </div>
            {/* Goals keep their spending bar. Subcategories show a single funding bar (assigned vs target),
                or an empty bar when there is no target yet, with the funded text on the same line. */}
            {kind === "goal" && (
              <MoneyProgress
                value={progress}
                tone={isDone ? "success" : statusStyle[status].tone}
                label={`${name}: ${formatWholeKr(spent)} of ${formatWholeKr(assigned)} saved`}
                className="mt-1 w-16 sm:w-36"
              />
            )}
            {kind === "subcategory" && funding && (
              <div className="mt-1 flex items-center gap-2">
                <MoneyProgress
                  value={funding.share}
                  tone={fundingTone[funding.state]}
                  label={`${name}: ${funding.label}`}
                  className="w-16 sm:w-36"
                />
                <p
                  className={`hidden text-xs whitespace-nowrap tabular-nums sm:block ${funding.state === "overspent" ? "text-accent" : "text-muted"}`}
                >
                  {funding.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-1 py-2 text-right sm:w-36 sm:px-3">
        {!amountEditing ? (
          <span className="px-2 tabular-nums">{formatWholeKr(assigned)}</span>
        ) : amountEditing.value !== null ? (
          <AmountInput
            label={`Assigned to ${name}`}
            value={amountEditing.value}
            onChange={amountEditing.onChange}
            onSave={amountEditing.onSave}
            onCancel={amountEditing.onCancel}
          />
        ) : (
          <button
            type="button"
            onClick={amountEditing.onStart}
            aria-label={`Change what is assigned to ${name}, now ${formatWholeKr(assigned)}`}
            className="cursor-text rounded-sm px-2 py-0.5 tabular-nums hover:bg-primary/10 hover:text-primary"
          >
            {formatWholeKr(assigned)}
          </button>
        )}
      </td>

      <td className="hidden w-32 px-3 py-2 text-right text-muted tabular-nums sm:table-cell">{formatWholeKr(spent)}</td>

      <td className="px-1 py-2 text-right sm:w-32 sm:px-3">
        {isDone ? (
          <StatusBadge tone="success" icon={Check} celebrate>
            Done
          </StatusBadge>
        ) : (
          <StatusBadge tone={statusStyle[status].tone} variant={statusStyle[status].variant}>
            {available}
          </StatusBadge>
        )}
      </td>

      <td className="w-8 py-2 pr-0 sm:w-10 sm:pr-2">
        {onRename && onDelete && (
          <Dropdown
            align="end"
            label={`Actions for ${name}`}
            triggerClassName="rounded-sm p-1 text-foreground/30 hover:bg-foreground/5 hover:text-foreground"
            trigger={<MoreHorizontal size={16} aria-hidden />}
          >
            {(close) => (
              <>
                <MenuItem
                  onClick={() => {
                    onRename();
                    close();
                  }}
                >
                  <Pencil size={16} aria-hidden />
                  Edit
                </MenuItem>
                <MenuItem
                  danger
                  onClick={() => {
                    onDelete();
                    close();
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                  Delete
                </MenuItem>
              </>
            )}
          </Dropdown>
        )}
      </td>
    </tr>
  );
};
