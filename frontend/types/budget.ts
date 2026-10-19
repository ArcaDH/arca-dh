import type { CategorySpending, GoalProgress } from "@/types/overview";
export type BudgetStatus = "progress" | "covered" | "over";

type LineBase = {
  id: string;
  name: string;
  assigned: number;
  spent: number;
  status: BudgetStatus;
  isDone: boolean; // a reached goal
};

// Thing money is assigned to each month - either a subcategory or a savings goal.
// A subcategory carries its optional monthly target (null = none).
export type BudgetLine =
  (LineBase & { kind: "subcategory"; target: number | null }) | (LineBase & { kind: "goal"; goal: GoalProgress });

// A heading with its lines: a category, or the savings goals (no category)
export type BudgetGroup = {
  name: string;
  assigned: number;
  spent: number;
  status: BudgetStatus;
  lines: BudgetLine[];
  category?: CategorySpending;
};

export type AmountEdit = { lineId: string; value: string };

// Create/rename dialog state. A subcategory only needs a name; target is optional.
export type BudgetItemForm = { name: string; target: string };

export type IncomeForm = { name: string; amount: string };
