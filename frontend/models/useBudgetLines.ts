import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/api/categories";
import { goalsApi } from "@/api/goals";
import type { BudgetLine } from "@/types/budget";

// What a line is assigned each month, either a subcategorys limit or a goals amount monthhly.
export function useSetAssigned(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ line, amount }: { line: BudgetLine; amount: number }): Promise<void> => {
      if (line.kind === "subcategory") {
        await categoriesApi.updateSubcategory(line.id, { name: line.name, limit: amount });
        return;
      }
      const { name, targetAmount, deadline } = line.goal;
      await goalsApi.update(line.id, { name, targetAmount, deadline, monthlyAmount: amount });
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plans", planId] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
      ]),
  });
}
