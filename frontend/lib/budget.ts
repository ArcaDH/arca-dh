import { goalAssigned, isGoalDone } from "@/lib/goals";
import { sumKr } from "@/lib/money";
import type { BudgetGroup, BudgetLine, BudgetStatus } from "@/types/budget";
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

export const categoryAssigned = (category: { subcategories: { limit: number }[] }): number =>
  sumKr(category.subcategories.map((subcategory) => subcategory.limit));

export const subcategoryLine = (subcategory: SubcategorySpending): BudgetLine => ({
  kind: "subcategory",
  id: subcategory.subcategoryId,
  name: subcategory.name,
  assigned: subcategory.limit,
  spent: subcategory.spent,
  status: budgetStatus(subcategory.spent, subcategory.limit),
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
