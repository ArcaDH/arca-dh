import { Plus } from "lucide-react";
import type { FC, ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import ErrorState from "@/components/ui/ErrorState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import Button from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { AmountEdit, BudgetGroup, BudgetLine, SelectionState } from "@/types/budget";
import type { CategorySpending } from "@/types/overview";
import { BudgetSkeleton } from "./BudgetSkeleton";
import { BudgetTableRowView } from "./table/BudgetTableRowView";

interface BudgetViewProps {
  month: string;
  // it can be null while loading
  groups: BudgetGroup[] | null;
  readyToAssign: ReactNode;
  // The bulk-action toolbar, shown above the table when lines are selected.
  selectionToolbar: ReactNode;
  amountEdit: AmountEdit | null;
  // Selection of subcategory lines for bulk assign. The set holds subcategory ids.
  selectedIds: Set<string>;
  // Null when there are no subcategories to select
  selectAll: SelectionState | null;
  categorySelections: Record<string, SelectionState>;
  isRefreshing: boolean;
  errorMessage: string | null;
  // Set when the failure is a load that can be tried again
  onRetry?: () => void;
  dialog: ReactNode;
  onMonthChange: (month: string) => void;
  onAddCategory: () => void;
  onAddSubcategory: (category: CategorySpending) => void;
  onToggleLine: (subcategoryId: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onToggleAll: () => void;
  onStartAmountEdit: (edit: AmountEdit) => void;
  onAmountEditChange: (value: string) => void;
  onSaveAmount: () => void;
  onCancelAmountEdit: () => void;
  onRenameCategory: (category: CategorySpending) => void;
  onRenameSubcategory: (line: BudgetLine) => void;
  onDeleteCategory: (category: CategorySpending) => void;
  onDeleteSubcategory: (line: BudgetLine) => void;
}

export const BudgetView: FC<BudgetViewProps> = ({
  month,
  groups,
  readyToAssign,
  selectionToolbar,
  amountEdit,
  selectedIds,
  selectAll,
  categorySelections,
  isRefreshing,
  errorMessage,
  onRetry,
  dialog,
  onMonthChange,
  onAddCategory,
  onAddSubcategory,
  onToggleLine,
  onToggleCategory,
  onToggleAll,
  onStartAmountEdit,
  onAmountEditChange,
  onSaveAmount,
  onCancelAmountEdit,
  onRenameCategory,
  onRenameSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
}) => {
  return (
    <div>
      <PageHeader aside={readyToAssign}>
        <MonthPicker month={month} onChange={onMonthChange} />
      </PageHeader>

      {errorMessage && <ErrorState message={errorMessage} onRetry={onRetry} />}

      {selectionToolbar}

      {!groups ? (
        !errorMessage && <BudgetSkeleton />
      ) : (
        <table className={`w-full text-sm transition-opacity ${isRefreshing ? "opacity-60" : ""}`}>
          <thead>
            <tr className="border-b border-foreground/10 text-xs text-muted">
              <th className="w-8 py-2 pr-1 pl-3">
                {selectAll && (
                  <div className="flex">
                    <Checkbox
                      checked={selectAll.checked}
                      indeterminate={selectAll.indeterminate}
                      label="Select all subcategories"
                      onChange={onToggleAll}
                    />
                  </div>
                )}
              </th>
              <th className="py-2 pr-3 pl-2 text-left font-medium">
                <span className="flex items-center gap-1.5">
                  Category
                  <Button size="xs" aria-label="New category" title="New category" onClick={onAddCategory}>
                    New
                    <Plus size={12} strokeWidth={2.5} aria-hidden />
                  </Button>
                </span>
              </th>
              <th className="px-3 py-2 text-right font-medium">Assigned</th>
              <th className="px-3 py-2 text-right font-medium">Spent</th>
              <th className="px-3 py-2 text-right font-medium">Available</th>
              <th className="w-10" aria-label="Actions" />
            </tr>
          </thead>
          {groups.map((group) => {
            const { category } = group;

            return (
              <tbody key={category?.categoryId ?? group.name}>
                <BudgetTableRowView
                  name={group.name}
                  assigned={group.assigned}
                  spent={group.spent}
                  status={group.status}
                  selection={
                    category
                      ? {
                          ...categorySelections[category.categoryId],
                          onToggle: () => onToggleCategory(category.categoryId),
                        }
                      : undefined
                  }
                  onAddSubcategory={category && (() => onAddSubcategory(category))}
                  onRename={category && (() => onRenameCategory(category))}
                  onDelete={category && (() => onDeleteCategory(category))}
                />
                {group.lines.map((line) => (
                  <BudgetTableRowView
                    key={line.id}
                    name={line.name}
                    assigned={line.assigned}
                    spent={line.spent}
                    target={line.kind === "subcategory" ? line.target : undefined}
                    kind={line.kind}
                    status={line.status}
                    isDone={line.isDone}
                    selection={
                      line.kind === "subcategory"
                        ? { checked: selectedIds.has(line.id), onToggle: () => onToggleLine(line.id) }
                        : undefined
                    }
                    amountEditing={{
                      value: amountEdit?.lineId === line.id ? amountEdit.value : null,
                      onStart: () => onStartAmountEdit({ lineId: line.id, value: String(line.assigned) }),
                      onChange: onAmountEditChange,
                      onSave: onSaveAmount,
                      onCancel: onCancelAmountEdit,
                    }}
                    // Goals are renamed and deleted on their own page
                    onRename={line.kind === "subcategory" ? () => onRenameSubcategory(line) : undefined}
                    onDelete={line.kind === "subcategory" ? () => onDeleteSubcategory(line) : undefined}
                  />
                ))}
              </tbody>
            );
          })}
          {groups.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={6} className="px-3 py-6 text-muted">
                  You haven&apos;t added any categories yet.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      )}

      {dialog}
    </div>
  );
};
