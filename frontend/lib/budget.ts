import { goalAssigned, isGoalDone } from "@/lib/goals";
import { formatWholeKr, sumKr } from "@/lib/money";
import type {
  AssignState,
  BudgetGroup,
  BudgetLine,
  BudgetStatus,
  SelectionState,
  SubcategoryFunding,
} from "@/types/budget";
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
export function subcategoryLine(subcategory: SubcategorySpending): BudgetLine {
  const status = budgetStatus(subcategory.spent, subcategory.assigned);
  return {
    kind: "subcategory",
    id: subcategory.subcategoryId,
    name: subcategory.name,
    assigned: subcategory.assigned,
    target: subcategory.target,
    spent: subcategory.spent,
    status,
    available: availableBadge(subcategory.assigned, subcategory.spent, status),
    funding: subcategoryFunding(subcategory.assigned, subcategory.spent, subcategory.target),
    isDone: false,
  };
}

export function goalLine(goal: GoalProgress, month: string): BudgetLine {
  const assigned = goalAssigned(goal, month);
  const status = budgetStatus(goal.savedThisMonth, assigned, true);
  const isDone = isGoalDone(goal);
  return {
    kind: "goal",
    id: goal.goalId,
    name: goal.name,
    assigned,
    spent: goal.savedThisMonth,
    status,
    available: availableBadge(assigned, goal.savedThisMonth, status),
    isDone,
    progress: isDone ? 1 : spentShare(goal.savedThisMonth, assigned),
    goal,
  };
}

// The budget table. each category with its subcategories, also then the savings goals as one more group
export function budgetGroups(categories: CategorySpending[], goals: GoalProgress[], month: string): BudgetGroup[] {
  const categoryGroups = categories.map((category) => {
    const assigned = categoryAssigned(category);
    const status = budgetStatus(category.spent, assigned);
    return {
      name: category.name,
      assigned,
      spent: category.spent,
      status,
      available: availableBadge(assigned, category.spent, status),
      lines: category.subcategories.map(subcategoryLine),
      category,
    };
  });
  if (goals.length === 0) return categoryGroups;

  const goalLines = goals.map((goal) => goalLine(goal, month));
  const assigned = sumKr(goalLines.map((line) => line.assigned));
  const spent = sumKr(goalLines.map((line) => line.spent));
  const status = budgetStatus(spent, assigned, true);
  const savings = {
    name: "Savings goals",
    assigned,
    spent,
    status,
    available: availableBadge(assigned, spent, status),
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

export const assignState = (toAssign: number): AssignState =>
  toAssign < 0 ? "over" : toAssign === 0 ? "done" : "left";

// What the Assign popup offers: reached goals need nothing more, and empty headings have nothing to pick
export const assignableGroups = (groups: BudgetGroup[]): BudgetGroup[] =>
  groups
    .map((group) => ({ ...group, lines: group.lines.filter((line) => !line.isDone) }))
    .filter((group) => group.lines.length > 0);
