import { goalAssigned, isGoalDone } from "@/lib/goals";
import { formatWholeKr, sumKr } from "@/lib/money";
import type { BudgetGroup, BudgetLine, BudgetStatus, SelectionState } from "@/types/budget";
import type { CategorySpending, GoalProgress, SubcategorySpending } from "@/types/overview";

// For savings, putting in more than planned is good, so it is covered and never over
export function budgetStatus(spent: number, budget: number, isSaving = false): BudgetStatus {
  if (spent > budget && !isSaving) return "over";
  if (spent > 0 && spent >= budget) return "covered";
  return "progress";
}

export function spentShare(spent: number, budget: number): number {
  if (budget <= 0) return spent > 0 ? 1 : 0;
  return Math.min(Math.max(spent / budget, 0), 1);
}

// Funding progress of a subcategory toward its monthly target (assigned vs target).
// No target means nothing to fund, so share is 0 and it is never "funded".
export function fundingShare(assigned: number, target: number | null): number {
  if (target === null || target <= 0) return 0;
  return Math.min(Math.max(assigned / target, 0), 1);
}

export const isFunded = (assigned: number, target: number | null): boolean =>
  target !== null && target > 0 && assigned >= target;

// Everything the row needs to render a subcategory's funding bar and caption, computed here so the
// view stays a dummy component. `state` drives the bar/text colour; the view only maps it to a tone.
export type FundingState = "overspent" | "funded" | "funding" | "none";

export type SubcategoryFunding = {
  state: FundingState;
  share: number; // 0..1 for the bar
  label: string; // accessible progressbar label
  caption: string; // short text shown next to the bar
};

export function subcategoryFunding(assigned: number, spent: number, target: number | null): SubcategoryFunding {
  if (spent > assigned) {
    return {
      state: "overspent",
      share: 1,
      label: `overspent, ${formatWholeKr(spent)} spent of ${formatWholeKr(assigned)} assigned`,
      caption: `Overspent ${formatWholeKr(spent - assigned)}`,
    };
  }
  if (target === null || target <= 0) {
    return { state: "none", share: 0, label: "no target", caption: "No target" };
  }
  if (isFunded(assigned, target)) {
    return {
      state: "funded",
      share: 1,
      label: `${formatWholeKr(assigned)} of ${formatWholeKr(target)} funded`,
      caption: `Funded ${formatWholeKr(target)}`,
    };
  }
  return {
    state: "funding",
    share: fundingShare(assigned, target),
    label: `${formatWholeKr(assigned)} of ${formatWholeKr(target)} funded`,
    caption: `${formatWholeKr(assigned)} of ${formatWholeKr(target)} funded`,
  };
}

// The "Available" column value and its display text. Overspending (negative, not a saving) shows the
// shortfall; a positive leftover on a saving shows a "+" since putting in more is good.
export function availableBadge(assigned: number, spent: number, status: BudgetStatus): string {
  const left = assigned - spent;
  return left < 0 && status !== "over" ? `+${formatWholeKr(-left)}` : formatWholeKr(left);
}

export const categoryAssigned = (category: { subcategories: { assigned: number }[] }): number =>
  sumKr(category.subcategories.map((subcategory) => subcategory.assigned));

// A subcategory line. The single progress bar shows funding (assigned vs target).
// Spending is shown separately. Status reflects the envelope balance (spent vs assigned):
// "over" when spent exceeds what was assigned, so the Available column turns red.
export const subcategoryLine = (subcategory: SubcategorySpending): BudgetLine => ({
  kind: "subcategory",
  id: subcategory.subcategoryId,
  name: subcategory.name,
  assigned: subcategory.assigned,
  target: subcategory.target,
  spent: subcategory.spent,
  status: budgetStatus(subcategory.spent, subcategory.assigned),
  isDone: false,
});

export function goalLine(goal: GoalProgress, month: string): BudgetLine {
  const assigned = goalAssigned(goal, month);
  return {
    kind: "goal",
    id: goal.goalId,
    name: goal.name,
    assigned,
    spent: goal.savedThisMonth,
    status: budgetStatus(goal.savedThisMonth, assigned, true),
    isDone: isGoalDone(goal),
    goal,
  };
}

// The budget table. each category with its subcategories, also then the savings goals as one more group
export function budgetGroups(categories: CategorySpending[], goals: GoalProgress[], month: string): BudgetGroup[] {
  const categoryGroups = categories.map((category) => ({
    name: category.name,
    assigned: categoryAssigned(category),
    spent: category.spent,
    status: budgetStatus(category.spent, categoryAssigned(category)),
    lines: category.subcategories.map(subcategoryLine),
    category,
  }));
  if (goals.length === 0) return categoryGroups;

  const goalLines = goals.map((goal) => goalLine(goal, month));
  const assigned = sumKr(goalLines.map((line) => line.assigned));
  const spent = sumKr(goalLines.map((line) => line.spent));
  const savings = {
    name: "Savings goals",
    assigned,
    spent,
    status: budgetStatus(spent, assigned, true),
    lines: goalLines,
  };
  return [...categoryGroups, savings];
}

// The subcategories under a category heading
export const groupSubcategoryIds = (group: BudgetGroup): string[] =>
  group.category ? group.lines.map((line) => line.id) : [];

export function selectionState(ids: string[], selected: Set<string>): SelectionState {
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  const all = ids.length > 0 && selectedCount === ids.length;
  return { checked: all, indeterminate: selectedCount > 0 && !all };
}
