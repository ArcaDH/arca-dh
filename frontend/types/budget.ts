import type { CategorySpending, GoalProgress } from "@/types/overview";

type LineBase = {
  id: string;
  name: string;
  assigned: number;
  spent: number;
  isDone: boolean; // a reached goal
};

// Thing money is assigned to each month - either a subcategory or a savings goal
export type BudgetLine = (LineBase & { kind: "subcategory" }) | (LineBase & { kind: "goal"; goal: GoalProgress });

// A heading with its lines: a category, or the savings goals (no category)
export type BudgetGroup = {
  name: string;
  assigned: number;
  spent: number;
  lines: BudgetLine[];
  category?: CategorySpending;
};

export type AmountEdit = { lineId: string; value: string };

export type BudgetItemForm = { name: string; amount: string };

export type IncomeForm = { name: string; amount: string };
