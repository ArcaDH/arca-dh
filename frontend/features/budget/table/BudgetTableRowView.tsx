import { Check, Goal, MoreHorizontal, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useEffect, useRef, type FC } from "react";
import Button from "@/components/ui/button";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { Dropdown } from "@/components/ui/Dropdown";
import { MenuItem } from "@/components/ui/MenuItem";
import { MoneyProgress } from "@/components/ui/MoneyProgress";
import { fundingShare, isFunded } from "@/lib/budget";
import { formatWholeKr } from "@/lib/money";
import type { BudgetLine, BudgetStatus } from "@/types/budget";

const statusStyle: Record<BudgetStatus, { tone: BadgeTone; variant: "solid" | "soft" }> = {
  progress: { tone: "success", variant: "soft" },
  covered: { tone: "success", variant: "solid" },
  over: { tone: "accent", variant: "soft" },
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

// A tri-state checkbox: checked, unchecked, or indeterminate (some children selected).
function SelectBox(props: { checked: boolean; indeterminate?: boolean; label: string; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!props.indeterminate && !props.checked;
  }, [props.indeterminate, props.checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={props.checked}
      aria-label={props.label}
      onChange={props.onChange}
      className="size-4 cursor-pointer rounded-sm border-foreground/30 text-primary focus:ring-primary/30"
    />
  );
}

interface BudgetTableRowViewProps {
  name: string;
  assigned: number;
  spent: number;
  // Subcategory monthly target (null = none). Undefined for headings/goals.
  target?: number | null;
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
  target = undefined,
  kind,
  status,
  isDone = false,
  selection,
  amountEditing,
  onAddSubcategory,
  onRename,
  onDelete,
}) => {
  const left = assigned - spent;
  const isLine = kind !== undefined;
  const hasTarget = kind === "subcategory" && target !== null && target !== undefined && target > 0;
  const funded = hasTarget && isFunded(assigned, target as number);
  const overspent = kind === "subcategory" && spent > assigned;

  return (
    <tr className={`group border-t border-foreground/10 ${isLine ? "" : "bg-foreground/[0.025] font-medium"}`}>
      <td className="w-8 py-2 pr-1 pl-3 align-top">
        {selection && (
          <span className="mt-1 flex">
            <SelectBox
              checked={selection.checked}
              indeterminate={selection.indeterminate}
              label={`Select ${name}`}
              onChange={selection.onToggle}
            />
          </span>
        )}
      </td>

      <td className={`py-2 pr-3 ${isLine ? "pl-2" : "pl-0"}`}>
        <div className="flex items-center gap-2.5">
          {kind === "subcategory" && (
            <Wallet size={18} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden />
          )}
          {kind === "goal" && (
            <Goal
              size={18}
              strokeWidth={1.75}
              className={`shrink-0 ${isDone ? "text-success" : "text-muted"}`}
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate">{name}</span>
              {onAddSubcategory && (
                <Button size="xs" variant="soft" aria-label={`Add subcategory to ${name}`} onClick={onAddSubcategory}>
                  <Plus size={12} strokeWidth={2.5} aria-hidden />
                  Subcategory
                </Button>
              )}
            </div>
            {/* Goals keep their spending bar. Subcategories show a single funding bar (assigned vs target),
                or an empty bar when there is no target yet, with the funded text on the same line. */}
            {kind === "goal" && (
              <MoneyProgress
                value={isDone ? 1 : assigned > 0 ? Math.min(spent / assigned, 1) : 0}
                tone={isDone ? "success" : statusStyle[status].tone}
                label={`${name}: ${formatWholeKr(spent)} of ${formatWholeKr(assigned)} saved`}
                className="mt-1 w-36"
              />
            )}
            {kind === "subcategory" && (
              <div className="mt-1 flex items-center gap-2">
                <MoneyProgress
                  value={overspent ? 1 : fundingShare(assigned, target ?? null)}
                  tone={overspent ? "accent" : funded ? "success" : "primary"}
                  label={
                    overspent
                      ? `${name}: overspent, ${formatWholeKr(spent)} spent of ${formatWholeKr(assigned)} assigned`
                      : hasTarget
                        ? `${name}: ${formatWholeKr(assigned)} of ${formatWholeKr(target as number)} funded`
                        : `${name}: no target`
                  }
                  className="w-36"
                />
                <p className={`text-xs whitespace-nowrap tabular-nums ${overspent ? "text-accent" : "text-muted"}`}>
                  {overspent
                    ? `Overspent ${formatWholeKr(spent - assigned)}`
                    : hasTarget
                      ? funded
                        ? `Funded ${formatWholeKr(target as number)}`
                        : `${formatWholeKr(assigned)} of ${formatWholeKr(target as number)} funded`
                      : "No target"}
                </p>
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="w-36 px-3 py-2 text-right">
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

      <td className="w-32 px-3 py-2 text-right text-muted tabular-nums">{formatWholeKr(spent)}</td>

      <td className="w-32 px-3 py-2 text-right">
        {isDone ? (
          <StatusBadge tone="success" icon={Check} celebrate>
            Done
          </StatusBadge>
        ) : (
          <StatusBadge tone={statusStyle[status].tone} variant={statusStyle[status].variant}>
            {left < 0 && status !== "over" ? `+${formatWholeKr(-left)}` : formatWholeKr(left)}
          </StatusBadge>
        )}
      </td>

      <td className="w-10 py-2 pr-2">
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
