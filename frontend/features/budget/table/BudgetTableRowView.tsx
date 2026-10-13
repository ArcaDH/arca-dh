import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, type FC } from "react";
import { SubcategoryIcon } from "@/components/icons/SubcategoryIcon";
import { Dropdown } from "@/components/ui/Dropdown";
import { MenuItem } from "@/components/ui/MenuItem";
import { MoneyProgress } from "@/components/ui/MoneyProgress";
import type { ProgressTone } from "@/components/ui/MoneyProgress";
import { budgetStatus, spentShare, type BudgetStatus } from "@/lib/budget";
import { formatWholeKr } from "@/lib/money";

const statusTone: Record<BudgetStatus, ProgressTone> = { ok: "success", near: "warning", over: "accent" };

const leftPill: Record<BudgetStatus, string> = {
  ok: "bg-success/10 text-success",
  near: "bg-warning/10 text-warning",
  over: "bg-accent/10 text-accent",
};

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
  isSubcategory?: boolean;
  amountEditing?: {
    value: string | null;
    onStart: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
  };
  onAddSubcategory?: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const BudgetTableRowView: FC<BudgetTableRowViewProps> = ({
  name,
  assigned,
  spent,
  isSubcategory = false,
  amountEditing,
  onAddSubcategory,
  onRename,
  onDelete,
}) => {
  const status = budgetStatus(spent, assigned);
  const left = assigned - spent;

  return (
    <tr className={`group border-t border-foreground/10 ${isSubcategory ? "" : "bg-foreground/[0.025] font-medium"}`}>
      <td className={`py-2 pr-3 ${isSubcategory ? "pl-6" : "pl-3"}`}>
        <div className="flex items-center gap-2.5">
          {isSubcategory && <SubcategoryIcon size={18} className="shrink-0 text-muted" aria-hidden />}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate">{name}</span>
              {onAddSubcategory && (
                <button
                  type="button"
                  aria-label={`Add subcategory to ${name}`}
                  onClick={onAddSubcategory}
                  className="flex cursor-pointer items-center gap-0.5 rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  <Plus size={12} strokeWidth={2.5} aria-hidden />
                  Subcategory
                </button>
              )}
            </div>
            {isSubcategory && (
              <MoneyProgress
                value={spentShare(spent, assigned)}
                tone={statusTone[status]}
                label={`${name}: ${formatWholeKr(spent)} of ${formatWholeKr(assigned)} spent`}
                className="mt-1 w-36"
              />
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
        <span className={`inline-block rounded-sm px-2 py-0.5 tabular-nums ${leftPill[status]}`}>
          {formatWholeKr(left)}
        </span>
      </td>

      <td className="w-10 py-2 pr-2">
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
                Rename
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
      </td>
    </tr>
  );
};
