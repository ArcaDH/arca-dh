import { Plus } from "lucide-react";
import type { FC, ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import Button from "@/components/ui/button";
import type { AmountEdit, BudgetGroup, BudgetLine } from "@/types/budget";
import type { CategorySpending } from "@/types/overview";
import { BudgetTableRowView } from "./table/BudgetTableRowView";

interface BudgetViewProps {
  month: string;
  // it can be null while loading
  groups: BudgetGroup[] | null;
  readyToAssign: ReactNode;
  amountEdit: AmountEdit | null;
  isRefreshing: boolean;
  errorMessage: string | null;
  dialog: ReactNode;
  onMonthChange: (month: string) => void;
  onAddCategory: () => void;
  onAddSubcategory: (category: CategorySpending) => void;
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
  amountEdit,
  isRefreshing,
  errorMessage,
  dialog,
  onMonthChange,
  onAddCategory,
  onAddSubcategory,
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

      {errorMessage && (
        <p role="alert" className="mb-4 bg-accent/10 px-4 py-3 text-sm text-accent">
          {errorMessage}
        </p>
      )}

      {!groups ? (
        !errorMessage && <p className="py-8 text-sm text-muted">Loading…</p>
      ) : (
        <table className={`w-full text-sm transition-opacity ${isRefreshing ? "opacity-60" : ""}`}>
          <thead>
            <tr className="border-b border-foreground/10 text-xs text-muted">
              <th className="px-3 py-2 text-left font-medium">
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
                    kind={line.kind}
                    isDone={line.isDone}
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
                <td colSpan={5} className="px-3 py-6 text-muted">
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
