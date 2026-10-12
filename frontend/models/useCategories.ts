import { useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories";
import type { CategoryInput, CategoryWithSubcategories, SubcategoryInput } from "@/types/category";

export function useCategories(planId: string | undefined) {
  const categories = useQuery({
    queryKey: ["plans", planId, "categories"],
    queryFn: () => categoriesApi.listByPlan(planId as string),
    enabled: !!planId,
  });

  const subcategoryLists = useQueries({
    queries: (categories.data ?? []).map((category) => ({
      queryKey: ["categories", category.id, "subcategories"],
      queryFn: () => categoriesApi.listSubcategories(category.id),
    })),
  });

  const isLoading = categories.isLoading || subcategoryLists.some((list) => list.isLoading);
  const error = categories.error ?? subcategoryLists.find((list) => list.error)?.error ?? null;

  const data: CategoryWithSubcategories[] | undefined =
    categories.data && !isLoading
      ? categories.data.map((category, index) => ({
          ...category,
          subcategories: subcategoryLists[index]?.data ?? [],
        }))
      : undefined;

  return { data, isLoading, error };
}

// Ensures that UI updates after mutations.
const invalidateCategories = (queryClient: QueryClient, planId: string) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["plans", planId] }),
    queryClient.invalidateQueries({ queryKey: ["categories"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
  ]);

export function useCreateCategory(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.create(planId, input),
    onSuccess: () => invalidateCategories(queryClient, planId),
  });
}

export function useUpdateCategory(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: CategoryInput }) =>
      categoriesApi.update(categoryId, input),
    onSuccess: () => invalidateCategories(queryClient, planId),
  });
}

export function useDeleteCategory(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => invalidateCategories(queryClient, planId),
  });
}

export function useCreateSubcategory(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: SubcategoryInput }) =>
      categoriesApi.createSubcategory(categoryId, input),
    onSuccess: () => invalidateCategories(queryClient, planId),
  });
}

export function useUpdateSubcategory(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subcategoryId, input }: { subcategoryId: string; input: SubcategoryInput }) =>
      categoriesApi.updateSubcategory(subcategoryId, input),
    onSuccess: () => invalidateCategories(queryClient, planId),
  });
}

export function useDeleteSubcategory(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.removeSubcategory,
    onSuccess: () => invalidateCategories(queryClient, planId),
  });
}
