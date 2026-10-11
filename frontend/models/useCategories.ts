import { useQueries, useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories";
import type { CategoryWithSubcategories } from "@/types/category";

/**
 * The categories of a plan, each with its subcategories. The backend lists subcategories per
 * category, so this loads the categories first and then one subcategory list for each of them.
 */
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
