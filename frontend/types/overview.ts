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

export type MonthlyOverview = {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  remaining: number;
  savings: number;
  spendingByCategory: CategorySpending[];
};
