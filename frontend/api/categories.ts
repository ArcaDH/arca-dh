import type { Category, Subcategory } from "@/types/category";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const categoriesApi = {
  listByPlan: (planId: string) => apiClient.get<Category[]>(Endpoints.Plans.categories(planId)),

  listSubcategories: (categoryId: string) =>
    apiClient.get<Subcategory[]>(Endpoints.Categories.subcategories(categoryId)),
};
