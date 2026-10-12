import type { Category, CategoryInput, Subcategory, SubcategoryInput } from "@/types/category";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const categoriesApi = {
  listByPlan: (planId: string) => apiClient.get<Category[]>(Endpoints.Plans.categories(planId)),

  create: (planId: string, input: CategoryInput) => apiClient.post<Category>(Endpoints.Plans.categories(planId), input),

  update: (categoryId: string, input: CategoryInput) =>
    apiClient.put<Category>(Endpoints.Categories.byId(categoryId), input),

  remove: (categoryId: string) => apiClient.delete<void>(Endpoints.Categories.byId(categoryId)),

  listSubcategories: (categoryId: string) =>
    apiClient.get<Subcategory[]>(Endpoints.Categories.subcategories(categoryId)),

  createSubcategory: (categoryId: string, input: SubcategoryInput) =>
    apiClient.post<Subcategory>(Endpoints.Categories.subcategories(categoryId), input),

  updateSubcategory: (subcategoryId: string, input: SubcategoryInput) =>
    apiClient.put<Subcategory>(Endpoints.Subcategories.byId(subcategoryId), input),

  removeSubcategory: (subcategoryId: string) => apiClient.delete<void>(Endpoints.Subcategories.byId(subcategoryId)),
};
