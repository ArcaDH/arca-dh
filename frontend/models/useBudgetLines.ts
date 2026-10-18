import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories";
import { goalsApi } from "@/api/goals";
import type { BudgetLine } from "@/types/budget";

const invalidateBudget = (queryClient: ReturnType<typeof useQueryClient>, planId: string) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["plans", planId] }),
    queryClient.invalidateQueries({ queryKey: ["categories"] }),
    queryClient.invalidateQueries({ queryKey: ["goals"] }),
    queryClient.invalidateQueries({ queryKey: ["overview"] }),
  ]);

// Set what a line is assigned in a given month. For a subcategory this writes a per-month
// assignment; for a goal it still updates the goal's monthly amount.
export function useSetAssigned(planId: string, month: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ line, amount }: { line: BudgetLine; amount: number }): Promise<void> => {
      if (line.kind === "subcategory") {
        await categoriesApi.setAssignment(line.id, month, amount);
        return;
      }
      const { name, targetAmount, deadline } = line.goal;
      await goalsApi.update(line.id, { name, targetAmount, deadline, monthlyAmount: amount });
    },
    onSuccess: () => invalidateBudget(queryClient, planId),
  });
}

// Fund the targets of the selected subcategories for the month (tops up under-funded lines).
export function useFundTargets(planId: string, month: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subcategoryIds: string[]) => categoriesApi.fundTargets(planId, month, subcategoryIds),
    onSuccess: () => invalidateBudget(queryClient, planId),
  });
}

// Assign the same amount to several subcategories for the month.
export function useBulkAssign(planId: string, month: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subcategoryIds, amount }: { subcategoryIds: string[]; amount: number }) =>
      categoriesApi.bulkAssign(planId, month, subcategoryIds, amount),
    onSuccess: () => invalidateBudget(queryClient, planId),
  });
}

// Cover overspending in the selected subcategories for the month (assigned raised to spent).
export function useCoverOverspending(planId: string, month: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subcategoryIds: string[]) => categoriesApi.coverOverspending(planId, month, subcategoryIds),
    onSuccess: () => invalidateBudget(queryClient, planId),
  });
}
