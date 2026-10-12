import { Plus } from "lucide-react";
import type { FC, ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { categoryAssigned } from "@/lib/budget";
import type { CategorySpending, SubcategorySpending } from "@/types/overview";
import { BudgetTableRowView } from "./table/BudgetTableRowView";
import type { AmountEdit } from "@/types/budget";

interface BudgetViewProps {
  month: string;
  categories: CategorySpending[] | null;
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
  onRenameSubcategory: (subcategory: SubcategorySpending) => void;
  onDeleteCategory: (category: CategorySpending) => void;
  onDeleteSubcategory: (subcategory: SubcategorySpending) => void;
}

export const BudgetView: FC<BudgetViewProps> = ({
  month,
  categories,
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

      {!categories ? (
        !errorMessage && <p className="py-8 text-sm text-muted">Loading…</p>
      ) : (
        <table className={`w-full text-sm transition-opacity ${isRefreshing ? "opacity-60" : ""}`}>
          <thead>
            <tr className="border-b border-foreground/10 text-xs text-muted">
              <th className="px-3 py-2 text-left font-medium">
                <span className="flex items-center gap-1.5">
                  Category
                  <button
                    type="button"
                    aria-label="New category"
                    title="New category"
                    onClick={onAddCategory}
                    className="flex cursor-pointer items-center gap-0.5 rounded-sm bg-primary px-1.5 py-0.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover active:bg-primary-active"
                  >
                    New
                    <Plus size={12} strokeWidth={2.5} aria-hidden />
                  </button>
                </span>
              </th>
              <th className="px-3 py-2 text-right font-medium">Assigned</th>
              <th className="px-3 py-2 text-right font-medium">Spent</th>
              <th className="px-3 py-2 text-right font-medium">Available</th>
              <th className="w-10" aria-label="Actions" />
            </tr>
          </thead>
          {categories.map((category) => (
            <tbody key={category.categoryId}>
              <BudgetTableRowView
                name={category.name}
                assigned={categoryAssigned(category)}
                spent={category.spent}
                onAddSubcategory={() => onAddSubcategory(category)}
                onRename={() => onRenameCategory(category)}
                onDelete={() => onDeleteCategory(category)}
              />
              {category.subcategories.map((subcategory) => (
                <BudgetTableRowView
                  key={subcategory.subcategoryId}
                  name={subcategory.name}
                  assigned={subcategory.limit}
                  spent={subcategory.spent}
                  isSubcategory
                  amountEditing={{
                    value: amountEdit?.subcategoryId === subcategory.subcategoryId ? amountEdit.value : null,
                    onStart: () =>
                      onStartAmountEdit({
                        subcategoryId: subcategory.subcategoryId,
                        value: String(subcategory.limit),
                      }),
                    onChange: onAmountEditChange,
                    onSave: onSaveAmount,
                    onCancel: onCancelAmountEdit,
                  }}
                  onRename={() => onRenameSubcategory(subcategory)}
                  onDelete={() => onDeleteSubcategory(subcategory)}
                />
              ))}
            </tbody>
          ))}
          {categories.length === 0 && (
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
