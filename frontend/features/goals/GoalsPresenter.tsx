"use client";

import { useState } from "react";
import { ApiError } from "@/api/ApiClient";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { currentMonth, toISODate } from "@/lib/format";
import { durationLabel, monthlyFor, toGoalCard } from "@/lib/goals";
import { formatWholeKr, parseKr, sumKr } from "@/lib/money";
import { useCreateGoal, useDeleteGoal, usePlanSavings, useUpdateGoal } from "@/models/useGoals";
import { useOverview } from "@/models/useOverview";
import { useCurrentPlan } from "@/models/usePlans";
import type { GoalFilter, GoalForm } from "@/types/goal";
import type { GoalProgress } from "@/types/overview";
import { GoalDetailView } from "./detail/GoalDetailView";
import { GoalFormView } from "./goal-form/GoalFormView";
import { GoalsView } from "./GoalsView";

type GoalFormTarget = { mode: "create" } | { mode: "edit"; goal: GoalProgress };

const EMPTY_FORM: GoalForm = { name: "", target: "", hasDeadline: false, deadline: "", monthly: "" };

// The first day a deadline can be, backend wants a future date
function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toISODate(date);
}

export const GoalsPresenter = () => {
  const month = currentMonth();

  const [filter, setFilter] = useState<GoalFilter>("all");
  const [formTarget, setFormTarget] = useState<GoalFormTarget | null>(null);
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [openGoalId, setOpenGoalId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GoalProgress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const plan = useCurrentPlan();
  const planId = plan.data?.id ?? "";
  const overview = useOverview(plan.data?.id, month);
  const goals = overview.data?.goalProgress ?? null;
  const savings = usePlanSavings(planId);
  const savingsFor = (goalId: string) => (savings.data ?? []).filter((saving) => saving.savingsGoalId === goalId);
  const cards = goals?.map((goal) => toGoalCard(goal, month, savingsFor(goal.goalId))) ?? null;
  const openGoal = goals?.find((goal) => goal.goalId === openGoalId) ?? null;

  const createGoal = useCreateGoal(planId);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const noPlanYet = plan.error instanceof ApiError && plan.error.status === 404;
  const loadError = noPlanYet
    ? "Create a budget plan first, with the plan picker in the sidebar."
    : (plan.error ?? overview.error)?.message;

  const alreadySaved = formTarget?.mode === "edit" ? formTarget.goal.savedAmount : 0;

  // With a date, what each month needs to make it in time
  function suggestedMonthly(next: GoalForm): number | null {
    const target = parseKr(next.target);
    if (!next.hasDeadline || !next.deadline || target === null) return null;
    return monthlyFor(target - alreadySaved, month, next.deadline);
  }

  function openForm(target: GoalFormTarget, initial: GoalForm) {
    setForm(initial);
    setFormError(null);
    setOpenGoalId(null);
    setFormTarget(target);
  }

  // Picking a date (or changing the target) fills in the monthly amount it needs
  function changeForm(changes: Partial<GoalForm>) {
    const next = { ...form, ...changes };
    const suggested = suggestedMonthly(next);
    const affectsSuggestion = "deadline" in changes || "target" in changes || "hasDeadline" in changes;
    setForm(suggested !== null && affectsSuggestion ? { ...next, monthly: String(suggested) } : next);
  }

  function saveForm() {
    if (!formTarget) return;
    const name = form.name.trim();
    const targetAmount = parseKr(form.target);
    if (!name) return setFormError("Enter a name.");
    if (targetAmount === null || targetAmount <= 0) return setFormError("Enter a target like 30000.");
    if (form.hasDeadline && !form.deadline) return setFormError("Pick a date, or turn off the date.");
    if (form.hasDeadline && form.deadline < tomorrow()) return setFormError("The date has to be in the future.");
    const monthly = form.monthly.trim() ? parseKr(form.monthly) : null;
    if (form.monthly.trim() && (monthly === null || monthly <= 0))
      return setFormError("Enter a monthly amount like 2500.");

    // Keeping the suggestion stores nothing, so it keeps following the date as money comes in
    const input = {
      name,
      targetAmount,
      deadline: form.hasDeadline ? form.deadline : null,
      monthlyAmount: monthly === suggestedMonthly(form) ? null : monthly,
    };
    const options = {
      onSuccess: () => setFormTarget(null),
      onError: (error: Error) => setFormError(error.message),
    };
    if (formTarget.mode === "create") createGoal.mutate(input, options);
    else updateGoal.mutate({ goalId: formTarget.goal.goalId, input }, options);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteGoal.mutate(pendingDelete.goalId, {
      onSuccess: () => setActionError(null),
      onError: (error) => setActionError(error.message),
      onSettled: () => setPendingDelete(null),
    });
  }

  function formHint(): string | null {
    const target = parseKr(form.target);
    const monthly = parseKr(form.monthly);
    const suggested = suggestedMonthly(form);
    if (target === null || monthly === null || monthly <= 0) return null;
    if (suggested !== null) {
      return monthly >= suggested
        ? "Enough to make it in time."
        : `It needs ${formatWholeKr(suggested)} a month to make it in time.`;
    }
    return `Reached in about ${durationLabel(Math.max(Math.ceil((target - alreadySaved) / monthly), 1))}.`;
  }

  const formDialog = formTarget && (
    <GoalFormView
      title={formTarget.mode === "create" ? "New savings goal" : `Edit ${formTarget.goal.name}`}
      form={form}
      minDeadline={tomorrow()}
      hint={formHint()}
      error={formError}
      isSaving={createGoal.isPending || updateGoal.isPending}
      onChange={changeForm}
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
      The {formatWholeKr(pendingDelete.savedAmount)} saved toward it is removed too, and becomes free to assign again.
    </ConfirmDialog>
  );

  const openCard = openGoal && toGoalCard(openGoal, month, savingsFor(openGoal.goalId));
  const detailDialog = openGoal && openCard && (
    <GoalDetailView
      name={openCard.name}
      target={openCard.target}
      saved={openCard.saved}
      savedThisMonth={openCard.savedThisMonth}
      monthly={openCard.monthly}
      remaining={openCard.remaining}
      timeShare={openCard.timeShare}
      deadline={openCard.deadline}
      isDone={openCard.isDone}
      reached={openCard.reached}
      savings={savings.data ? savingsFor(openGoal.goalId) : null}
      onEdit={() =>
        openForm(
          { mode: "edit", goal: openGoal },
          {
            name: openGoal.name,
            target: String(openGoal.targetAmount),
            hasDeadline: openGoal.deadline !== null,
            deadline: openGoal.deadline ?? "",
            monthly: openCard.monthly > 0 ? String(openCard.monthly) : "",
          },
        )
      }
      onDelete={() => {
        setOpenGoalId(null);
        setPendingDelete(openGoal);
      }}
      onClose={() => setOpenGoalId(null)}
    />
  );

  return (
    <GoalsView
      cards={cards?.filter((card) => filter === "all" || card.isDone === (filter === "done")) ?? null}
      counts={{
        all: cards?.length ?? 0,
        active: cards?.filter((card) => !card.isDone).length ?? 0,
        done: cards?.filter((card) => card.isDone).length ?? 0,
      }}
      filter={filter}
      onFilterChange={setFilter}
      totalSaved={sumKr((goals ?? []).map((goal) => goal.savedAmount))}
      totalTarget={sumKr((goals ?? []).map((goal) => goal.targetAmount))}
      neededThisMonth={sumKr((cards ?? []).filter((card) => !card.isDone).map((card) => card.monthly))}
      errorMessage={actionError ?? loadError ?? null}
      dialog={formDialog || deleteDialog || detailDialog}
      onAddGoal={() => openForm({ mode: "create" }, EMPTY_FORM)}
      onOpenGoal={setOpenGoalId}
    />
  );
};
