"use client";

import { useState } from "react";
import { ApiError } from "@/api/ApiClient";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { assignableGroups, assignState, budgetGroups, groupSubcategoryIds, selectionState } from "@/lib/budget";
import { currentMonth } from "@/lib/format";
import { parseKr, sumKr } from "@/lib/money";
import {
  useCreateCategory,
  useCreateSubcategory,
  useDeleteCategory,
  useDeleteSubcategory,
  useUpdateCategory,
  useUpdateSubcategory,
} from "@/models/useCategories";
import { useFundTargets, useBulkAssign, useCoverOverspending, useSetAssigned } from "@/models/useBudgetLines";
import { useOverview } from "@/models/useOverview";
import { useCurrentPlan } from "@/models/usePlans";
import { BudgetItemFormView } from "./item-form/BudgetItemFormView";
import { BudgetView } from "./BudgetView";
import type { AmountEdit, BudgetItemForm, BudgetLine } from "@/types/budget";
import { IncomeSourcesPresenter } from "./income/IncomeSourcesPresenter";
import { ReadyToAssignView } from "./assign/ReadyToAssignView";
import { SelectionToolbarView } from "./assign/SelectionToolbarView";

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

// Parse the optional target field: blank means "no target" (null); a bad value is "invalid".
const parseTargetField = (value: string): number | null | "invalid" => {
  if (value.trim() === "") return null;
  const parsed = parseKr(value);
  return parsed === null ? "invalid" : parsed;
};

export const BudgetPresenter = () => {
  const [month, setMonth] = useState(currentMonth);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [form, setForm] = useState<BudgetItemForm>({ name: "", target: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [amountEdit, setAmountEdit] = useState<AmountEdit | null>(null);
  const [assignAmount, setAssignAmount] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAmount, setBulkAmount] = useState("");
  const [selectionError, setSelectionError] = useState<string | null>(null);
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
  const setAssigned = useSetAssigned(planId, month);
  const fundTargets = useFundTargets(planId, month);
  const bulkAssign = useBulkAssign(planId, month);
  const coverOverspending = useCoverOverspending(planId, month);

  const income = overview.data?.totalIncome ?? 0;
  const groups = overview.data
    ? budgetGroups(overview.data.spendingByCategory, overview.data.goalProgress, month)
    : null;
  const lines = (groups ?? []).flatMap((group) => group.lines);
  const assigned = sumKr((groups ?? []).map((group) => group.assigned));
  const toAssign = income - assigned;

  // Subcategories that have a target, so "Fund all targets" knows what to act on.
  const targetedSubcategoryIds = lines
    .filter((line) => line.kind === "subcategory" && line.target !== null && line.target > 0)
    .map((line) => line.id);

  // Keep only selected ids that still exist as subcategory lines.
  const validSelected = new Set(
    [...selectedIds].filter((id) => lines.some((line) => line.kind === "subcategory" && line.id === id)),
  );

  // The header checkbox covers every subcategory; each category heading covers its own
  const allSubcategoryIds = (groups ?? []).flatMap(groupSubcategoryIds);
  const selectAll = allSubcategoryIds.length > 0 ? selectionState(allSubcategoryIds, validSelected) : null;
  const categorySelections = Object.fromEntries(
    (groups ?? []).flatMap((group) =>
      group.category ? [[group.category.categoryId, selectionState(groupSubcategoryIds(group), validSelected)]] : [],
    ),
  );

  // Selected subcategory lines that are overspent (spent > assigned), for "Cover overspending".
  const overspentSelectedIds = lines
    .filter((line) => line.kind === "subcategory" && validSelected.has(line.id) && line.spent > line.assigned)
    .map((line) => line.id);

  const noPlanYet = plan.error instanceof ApiError && plan.error.status === 404;
  const loadError = noPlanYet
    ? "Create a budget plan first, with the plan picker in the sidebar."
    : (plan.error ?? overview.error)?.message;
  // "Try again" is only for a failed load. Action errors, and "create a plan first", need something else.
  const retryLoad = () => {
    if (plan.error) plan.refetch();
    if (overview.error) overview.refetch();
  };

  const onActionError = (error: Error) => setActionError(error.message);

  function toggleLine(subcategoryId: string) {
    setSelectionError(null);
    setSelectedIds((current) =>
      current.has(subcategoryId)
        ? new Set([...current].filter((id) => id !== subcategoryId))
        : new Set([...current, subcategoryId]),
    );
  }

  // Selecting a heading selects all its subcategories; toggling off clears them
  function toggleMany(subcategoryIds: string[]) {
    setSelectionError(null);
    setSelectedIds((current) => {
      const allSelected = subcategoryIds.length > 0 && subcategoryIds.every((id) => current.has(id));
      return allSelected
        ? new Set([...current].filter((id) => !subcategoryIds.includes(id)))
        : new Set([...current, ...subcategoryIds]);
    });
  }

  function toggleCategory(categoryId: string) {
    const group = (groups ?? []).find((item) => item.category?.categoryId === categoryId);
    if (group) toggleMany(groupSubcategoryIds(group));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkAmount("");
    setSelectionError(null);
  }

  // Changing month clears the selection so nothing stays checked across a different month's lines.
  function changeMonth(next: string) {
    clearSelection();
    setMonth(next);
  }

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

    // Subcategory: name required, target optional (blank = no target).
    const target = parseTargetField(form.target);
    if (target === "invalid") return setFormError("Enter a target like 3000 or 249,50, or leave it blank.");

    if (formTarget.mode === "createSubcategory") {
      createSubcategory.mutate({ categoryId: formTarget.categoryId, input: { name, target } }, options);
    }
    if (formTarget.mode === "editSubcategory") {
      updateSubcategory.mutate({ subcategoryId: formTarget.subcategoryId, input: { name, target } }, options);
    }
  }

  function saveAmount() {
    if (!amountEdit) return;
    setAmountEdit(null);
    const amount = parseKr(amountEdit.value);
    if (amount === null || amount < 0) return setActionError("Enter an amount like 3000 or 249,50.");

    const line = lines.find((item) => item.id === amountEdit.lineId);
    if (!line || line.assigned === amount) return;
    setAssigned.mutate({ line, amount }, { onError: onActionError });
  }

  // Add the entered amount to a line's current assigned money, from the "Ready to assign" popup.
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

  // Top up every subcategory that has a target to meet it, for the current month.
  function fundAllTargets(close: () => void) {
    if (targetedSubcategoryIds.length === 0) return close();
    setAssignError(null);
    fundTargets.mutate(targetedSubcategoryIds, {
      onSuccess: () => {
        clearSelection();
        close();
      },
      onError: (error) => setAssignError(error.message),
    });
  }

  // Selection toolbar: fund the targets of the checked lines.
  function fundSelectedTargets() {
    const ids = [...validSelected];
    if (ids.length === 0) return;
    setSelectionError(null);
    fundTargets.mutate(ids, {
      onSuccess: () => clearSelection(),
      onError: (error) => setSelectionError(error.message),
    });
  }

  // Selection toolbar: assign the typed amount to each checked line.
  function assignToSelected() {
    const ids = [...validSelected];
    if (ids.length === 0) return;
    const amount = parseKr(bulkAmount);
    if (amount === null || amount < 0) return setSelectionError("Enter an amount like 3000 or 249,50.");
    setSelectionError(null);
    bulkAssign.mutate(
      { subcategoryIds: ids, amount },
      {
        onSuccess: () => clearSelection(),
        onError: (error) => setSelectionError(error.message),
      },
    );
  }

  // Selection toolbar: raise each overspent selected line's assigned to its spent, so Available = 0.
  function coverSelectedOverspending() {
    if (overspentSelectedIds.length === 0) return;
    setSelectionError(null);
    coverOverspending.mutate(overspentSelectedIds, {
      onSuccess: () => clearSelection(),
      onError: (error) => setSelectionError(error.message),
    });
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
      showTarget={isSubcategoryForm(formTarget)}
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
            assignState={assignState(toAssign)}
            toAssign={toAssign}
            income={income}
            assigned={assigned}
            groups={assignableGroups(groups ?? [])}
            amount={assignAmount}
            error={assignError}
            isSaving={setAssigned.isPending}
            isFunding={fundTargets.isPending}
            hasTargets={targetedSubcategoryIds.length > 0}
            onAmountChange={setAssignAmount}
            onAssign={assign}
            onFundAllTargets={fundAllTargets}
            onEditIncome={() => setIsIncomeOpen(true)}
          />
        )
      }
      amountEdit={amountEdit}
      selectionToolbar={
        validSelected.size > 0 && (
          <SelectionToolbarView
            count={validSelected.size}
            overspentCount={overspentSelectedIds.length}
            amount={bulkAmount}
            error={selectionError}
            isAssigning={bulkAssign.isPending}
            isFunding={fundTargets.isPending}
            isCovering={coverOverspending.isPending}
            onAmountChange={setBulkAmount}
            onAssign={assignToSelected}
            onFundTargets={fundSelectedTargets}
            onCoverOverspending={coverSelectedOverspending}
            onClear={clearSelection}
          />
        )
      }
      selectedIds={validSelected}
      selectAll={selectAll}
      categorySelections={categorySelections}
      isRefreshing={overview.isPlaceholderData}
      errorMessage={actionError ?? loadError ?? null}
      onRetry={actionError || noPlanYet || !loadError ? undefined : retryLoad}
      dialog={formDialog || deleteDialog || incomeDialog}
      onMonthChange={changeMonth}
      onAddCategory={() => openForm({ mode: "createCategory" }, { name: "", target: "" })}
      onAddSubcategory={(category) =>
        openForm(
          { mode: "createSubcategory", categoryId: category.categoryId, categoryName: category.name },
          { name: "", target: "" },
        )
      }
      onToggleLine={toggleLine}
      onToggleCategory={toggleCategory}
      onToggleAll={() => toggleMany(allSubcategoryIds)}
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
          { name: category.name, target: "" },
        )
      }
      onRenameSubcategory={(line) =>
        openForm(
          { mode: "editSubcategory", subcategoryId: line.id, name: line.name },
          {
            name: line.name,
            target: line.kind === "subcategory" && line.target !== null ? String(line.target) : "",
          },
        )
      }
      onDeleteCategory={(category) =>
        setPendingDelete({ kind: "category", id: category.categoryId, name: category.name })
      }
      onDeleteSubcategory={(line) => setPendingDelete({ kind: "subcategory", id: line.id, name: line.name })}
    />
  );
};
