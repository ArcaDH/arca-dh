import { goalAssigned, isGoalDone } from "@/lib/goals";
import { sumKr } from "@/lib/money";
import type { BudgetGroup, BudgetLine } from "@/types/budget";
import type { CategorySpending, GoalProgress, SubcategorySpending } from "@/types/overview";

export type BudgetStatus = "ok" | "near" | "over";

const NEAR_LIMIT = 0.9;

export function budgetStatus(spent: number, budget: number): BudgetStatus {
  if (spent > budget) return "over";
  if (budget > 0 && spent / budget >= NEAR_LIMIT) return "near";
  return "ok";
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
  isDone: false,
});

export const goalLine = (goal: GoalProgress, month: string): BudgetLine => ({
  kind: "goal",
  id: goal.goalId,
  name: goal.name,
  assigned: goalAssigned(goal, month),
  spent: goal.savedThisMonth,
  isDone: isGoalDone(goal),
  goal,
});

// The budget table. each category with its subcategories, also then the savings goals as one more group
export function budgetGroups(categories: CategorySpending[], goals: GoalProgress[], month: string): BudgetGroup[] {
  const categoryGroups = categories.map((category) => ({
    name: category.name,
    assigned: categoryAssigned(category),
    spent: category.spent,
    lines: category.subcategories.map(subcategoryLine),
    category,
  }));
  if (goals.length === 0) return categoryGroups;

  const goalLines = goals.map((goal) => goalLine(goal, month));
  const savings = {
    name: "Savings goals",
    assigned: sumKr(goalLines.map((line) => line.assigned)),
    spent: sumKr(goalLines.map((line) => line.spent)),
    lines: goalLines,
  };
  return [...categoryGroups, savings];
}
