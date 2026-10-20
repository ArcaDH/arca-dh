import type { CategorySpending, GoalProgress } from "@/types/overview";
export type BudgetStatus = "progress" | "covered" | "over";

// A subcategory's funding bar, state picks color
export type FundingState = "overspent" | "funded" | "funding" | "none";

export type SubcategoryFunding = {
  state: FundingState;
  share: number; // fills the bar
  label: string;
  caption: string; // short text shown next to the bar
};

// Whether income is left to assign, all of it is assigned, or more than the income is
export type AssignState = "left" | "done" | "over";

type LineBase = {
  id: string;
  name: string;
  assigned: number;
  spent: number;
  status: BudgetStatus;
  available: string;
  isDone: boolean; // a reached goal
};

// Thing money is assigned to each month - either a subcategory or a savings goal.
// A subcategory carries its optional monthly target (null = none).
export type BudgetLine =
  | (LineBase & { kind: "subcategory"; target: number | null; funding: SubcategoryFunding })
  | (LineBase & { kind: "goal"; goal: GoalProgress; progress: number });

// A heading with its lines: a category, or the savings goals (no category)
// A checkbox standing for several subcategories: all selected, some (shown as a dash), or none
export type SelectionState = { checked: boolean; indeterminate: boolean };

export type BudgetGroup = {
  name: string;
  assigned: number;
  spent: number;
  status: BudgetStatus;
  available: string;
  lines: BudgetLine[];
  category?: CategorySpending;
};

export type AmountEdit = { lineId: string; value: string };

// Create/rename dialog state. A subcategory only needs a name; target is optional.
export type BudgetItemForm = { name: string; target: string };

export type IncomeForm = { name: string; amount: string };
