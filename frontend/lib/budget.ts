import { sumKr } from "@/lib/money";

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
