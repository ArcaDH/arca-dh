export type IncomeSource = {
  id: string;
  name: string;
  monthlyAmount: string;
  budgetPlanId: string;
};

// What the page sends to add or update an income source.
export type IncomeSourceInput = {
  name: string;
  monthlyAmount: number;
};
