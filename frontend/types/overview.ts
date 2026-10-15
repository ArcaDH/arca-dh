export type SubcategorySpending = {
  subcategoryId: string;
  name: string;
  limit: number;
  spent: number;
};

export type CategorySpending = {
  categoryId: string;
  name: string;
  maxBudget: number;
  spent: number;
  subcategories: SubcategorySpending[];
};

export type GoalProgress = {
  goalId: string;
  name: string;
  targetAmount: number;
  deadline: string | null; // "YYYY-MM-DD", null for a loose goal
  createdAt: string;
  monthlyAmount: number | null;
  savedAmount: number; // all time
  savedThisMonth: number;
  progress: number; // 0 to 1
};

export type MonthlyOverview = {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  remaining: number;
  savings: number;
  spendingByCategory: CategorySpending[];
  goalProgress: GoalProgress[];
};
