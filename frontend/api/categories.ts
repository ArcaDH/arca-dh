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

  // Set the money assigned to a subcategory in a given month (YYYY-MM).
  setAssignment: (subcategoryId: string, month: string, assigned: number) =>
    apiClient.put<unknown>(Endpoints.Subcategories.assignment(subcategoryId, month), { assigned }),

  // Fund the targets of the given subcategories for a month (tops up under-funded, skips funded).
  fundTargets: (planId: string, month: string, subcategoryIds: string[]) =>
    apiClient.post<unknown>(Endpoints.Plans.fundTargets(planId), { month, subcategoryIds }),

  // Assign the same amount to several subcategories for a month.
  bulkAssign: (planId: string, month: string, subcategoryIds: string[], assigned: number) =>
    apiClient.post<unknown>(Endpoints.Plans.bulkAssign(planId), { month, subcategoryIds, assigned }),

  // Cover overspending: raise each selected overspent subcategory's assigned to its spent amount.
  coverOverspending: (planId: string, month: string, subcategoryIds: string[]) =>
    apiClient.post<unknown>(Endpoints.Plans.coverOverspending(planId), { month, subcategoryIds }),
};
