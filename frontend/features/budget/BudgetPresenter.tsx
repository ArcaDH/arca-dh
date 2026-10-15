"use client";

import { useState } from "react";
import { ApiError } from "@/api/ApiClient";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { budgetGroups } from "@/lib/budget";
import { currentMonth } from "@/lib/format";
import { formatWholeKr, parseKr, sumKr } from "@/lib/money";
import {
  useCreateCategory,
  useCreateSubcategory,
  useDeleteCategory,
  useDeleteSubcategory,
  useUpdateCategory,
  useUpdateSubcategory,
} from "@/models/useCategories";
import { useSetAssigned } from "@/models/useBudgetLines";
import { useOverview } from "@/models/useOverview";
import { useCurrentPlan } from "@/models/usePlans";
import { BudgetItemFormView } from "./item-form/BudgetItemFormView";
import { BudgetView } from "./BudgetView";
import type { AmountEdit, BudgetItemForm, BudgetLine } from "@/types/budget";
import { IncomeSourcesPresenter } from "./income/IncomeSourcesPresenter";
import { ReadyToAssignView } from "./assign/ReadyToAssignView";

type FormTarget =
  | { mode: "createCategory" }
  | { mode: "editCategory"; categoryId: string; name: string; maxBudget: number }
  | { mode: "createSubcategory"; categoryId: string; categoryName: string }
  | { mode: "editSubcategory"; subcategoryId: string; name: string };

type PendingDelete = { kind: "category" | "subcategory"; id: string; name: string };

const formTitle = (target: FormTarget): string => {
  if (target.mode === "createCategory") return "New category";
  if (target.mode === "createSubcategory") return `New subcategory in ${target.categoryName}`;
  return `Edit ${target.name}`;
};

const isSubcategoryForm = (target: FormTarget) =>
  target.mode === "createSubcategory" || target.mode === "editSubcategory";

export const BudgetPresenter = () => {
  const [month, setMonth] = useState(currentMonth);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [form, setForm] = useState<BudgetItemForm>({ name: "", amount: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [amountEdit, setAmountEdit] = useState<AmountEdit | null>(null);
  const [assignAmount, setAssignAmount] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);

  const plan = useCurrentPlan();
  const planId = plan.data?.id ?? "";
  const overview = useOverview(plan.data?.id, month);

  const createCategory = useCreateCategory(planId);
  const updateCategory = useUpdateCategory(planId);
  const deleteCategory = useDeleteCategory(planId);
  const createSubcategory = useCreateSubcategory(planId);
  const updateSubcategory = useUpdateSubcategory(planId);
  const deleteSubcategory = useDeleteSubcategory(planId);
  const setAssigned = useSetAssigned(planId);

  const income = overview.data?.totalIncome ?? 0;
  const groups = overview.data
    ? budgetGroups(overview.data.spendingByCategory, overview.data.goalProgress, month)
    : null;
  const lines = (groups ?? []).flatMap((group) => group.lines);
  const assigned = sumKr((groups ?? []).map((group) => group.assigned));
  const toAssign = income - assigned;

  const noPlanYet = plan.error instanceof ApiError && plan.error.status === 404;
  const loadError = noPlanYet
    ? "Create a budget plan first, with the plan picker in the sidebar."
    : (plan.error ?? overview.error)?.message;

  const onActionError = (error: Error) => setActionError(error.message);

  function openForm(target: FormTarget, initial: BudgetItemForm) {
    setForm(initial);
    setFormError(null);
    setFormTarget(target);
  }

  function saveForm() {
    if (!formTarget) return;
    const name = form.name.trim();
    if (!name) return setFormError("Enter a name.");

    const options = {
      onSuccess: () => setFormTarget(null),
      onError: (error: Error) => setFormError(error.message),
    };
    if (formTarget.mode === "createCategory") return createCategory.mutate({ name, maxBudget: 0 }, options);
    if (formTarget.mode === "editCategory") {
      const input = { name, maxBudget: formTarget.maxBudget };
      return updateCategory.mutate({ categoryId: formTarget.categoryId, input }, options);
    }

    const amount = parseKr(form.amount);
    if (amount === null) return setFormError("Enter an amount like 3000 or 249,50.");
    if (formTarget.mode === "createSubcategory") {
      createSubcategory.mutate({ categoryId: formTarget.categoryId, input: { name, limit: amount } }, options);
    }
    if (formTarget.mode === "editSubcategory") {
      updateSubcategory.mutate({ subcategoryId: formTarget.subcategoryId, input: { name, limit: amount } }, options);
    }
  }

  function saveAmount() {
    if (!amountEdit) return;
    setAmountEdit(null);
    const amount = parseKr(amountEdit.value);
    if (amount === null) return setActionError("Enter an amount like 3000 or 249,50.");

    const line = lines.find((item) => item.id === amountEdit.lineId);
    if (!line || line.assigned === amount) return;
    setAssigned.mutate({ line, amount }, { onError: onActionError });
  }

  function assign(line: BudgetLine, close: () => void) {
    const amount = parseKr(assignAmount);
    if (amount === null || amount <= 0) return setAssignError("Enter an amount to assign.");

    setAssignError(null);
    setAssigned.mutate(
      { line, amount: line.assigned + amount },
      {
        onSuccess: () => {
          setAssignAmount("");
          close();
        },
        onError: (error) => setAssignError(error.message),
      },
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const options = {
      onSuccess: () => setActionError(null),
      onError: onActionError,
      onSettled: () => setPendingDelete(null),
    };
    if (pendingDelete.kind === "category") deleteCategory.mutate(pendingDelete.id, options);
    else deleteSubcategory.mutate(pendingDelete.id, options);
  }

  const formDialog = formTarget && (
    <BudgetItemFormView
      title={formTitle(formTarget)}
      amountLabel={isSubcategoryForm(formTarget) ? "Assigned per month" : undefined}
      hint={
        !isSubcategoryForm(formTarget)
          ? null
          : toAssign >= 0
            ? `${formatWholeKr(toAssign)} ready to assign`
            : `Over-assigned by ${formatWholeKr(-toAssign)}`
      }
      form={form}
      error={formError}
      isSaving={
        createCategory.isPending ||
        updateCategory.isPending ||
        createSubcategory.isPending ||
        updateSubcategory.isPending
      }
      onChange={(changes) => setForm((current) => ({ ...current, ...changes }))}
      onSubmit={saveForm}
      onClose={() => setFormTarget(null)}
    />
  );

  const deleteDialog = pendingDelete && (
    <ConfirmDialog
      title={`Delete ${pendingDelete.name}?`}
      onCancel={() => setPendingDelete(null)}
      actions={[{ label: "Delete", danger: true, onClick: confirmDelete }]}
    >
      {pendingDelete.kind === "category"
        ? "Its subcategories are deleted too. Transactions in it are kept, but lose their category."
        : "Transactions in it are kept, but lose their subcategory."}
    </ConfirmDialog>
  );

  const incomeDialog = isIncomeOpen && (
    <IncomeSourcesPresenter planId={planId} onClose={() => setIsIncomeOpen(false)} />
  );

  return (
    <BudgetView
      month={month}
      groups={groups}
      readyToAssign={
        overview.data && (
          <ReadyToAssignView
            toAssign={toAssign}
            income={income}
            assigned={assigned}
            groups={groups ?? []}
            amount={assignAmount}
            error={assignError}
            isSaving={setAssigned.isPending}
            onAmountChange={setAssignAmount}
            onAssign={assign}
            onEditIncome={() => setIsIncomeOpen(true)}
          />
        )
      }
      amountEdit={amountEdit}
      isRefreshing={overview.isPlaceholderData}
      errorMessage={actionError ?? loadError ?? null}
      dialog={formDialog || deleteDialog || incomeDialog}
      onMonthChange={setMonth}
      onAddCategory={() => openForm({ mode: "createCategory" }, { name: "", amount: "" })}
      onAddSubcategory={(category) =>
        openForm(
          { mode: "createSubcategory", categoryId: category.categoryId, categoryName: category.name },
          { name: "", amount: "" },
        )
      }
      onStartAmountEdit={(edit) => {
        setActionError(null);
        setAmountEdit(edit);
      }}
      onAmountEditChange={(value) => setAmountEdit((current) => current && { ...current, value })}
      onSaveAmount={saveAmount}
      onCancelAmountEdit={() => setAmountEdit(null)}
      onRenameCategory={(category) =>
        openForm(
          {
            mode: "editCategory",
            categoryId: category.categoryId,
            name: category.name,
            maxBudget: category.maxBudget,
          },
          { name: category.name, amount: "" },
        )
      }
      onRenameSubcategory={(line) =>
        openForm(
          { mode: "editSubcategory", subcategoryId: line.id, name: line.name },
          { name: line.name, amount: String(line.assigned) },
        )
      }
      onDeleteCategory={(category) =>
        setPendingDelete({ kind: "category", id: category.categoryId, name: category.name })
      }
      onDeleteSubcategory={(line) => setPendingDelete({ kind: "subcategory", id: line.id, name: line.name })}
    />
  );
};
