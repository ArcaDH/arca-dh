// types/category.ts: matches what the backend sends for categories and subcategories.
// The backend sends the money fields as text (e.g. "5000.00").
export type Category = {
  id: string;
  name: string;
  maxBudget: string;
  budgetPlanId: string;
};

export type Subcategory = {
  id: string;
  name: string;
  limit: string;
  categoryId: string;
};

/** The backend lists subcategories per category, so the app joins them together. */
export type CategoryWithSubcategories = Category & { subcategories: Subcategory[] };
