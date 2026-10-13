export type AmountEdit = { subcategoryId: string; value: string };

// The create/rename popup's fields
export type BudgetItemForm = { name: string; amount: string };

// An income source's fields while adding or editing it
export type IncomeForm = { name: string; amount: string };

// A subcategory in the assign popover's list
export type AssignOption = { id: string; name: string; assigned: number };

// A category and its subcategories in that list
export type AssignGroup = { name: string; subcategories: AssignOption[] };
