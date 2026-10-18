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
  target: string | null;
  categoryId: string;
};

/** The backend lists subcategories per category, so the app joins them together. */
export type CategoryWithSubcategories = Category & { subcategories: Subcategory[] };

//What the page sends to create or update a category
export type CategoryInput = {
  name: string;
  maxBudget: number;
};

//What the page sends to create or update a subcategory. Only the name is required.
export type SubcategoryInput = {
  name: string;
  target?: number | null;
};
