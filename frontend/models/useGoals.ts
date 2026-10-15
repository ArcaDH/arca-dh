import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goalsApi } from "@/api/goals";
import { transactionsApi } from "@/api/transactions";
import type { SavingsGoalInput } from "@/types/goal";

export function useGoals(planId: string | undefined) {
  return useQuery({
    queryKey: ["goals", planId],
    queryFn: () => goalsApi.listByPlan(planId as string),
    enabled: !!planId,
  });
}

function useInvalidateOverview() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
    ]);
}

export function useCreateGoal(planId: string) {
  const invalidate = useInvalidateOverview();
  return useMutation({
    mutationFn: (input: SavingsGoalInput) => goalsApi.create(planId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateOverview();
  return useMutation({
    mutationFn: ({ goalId, input }: { goalId: string; input: SavingsGoalInput }) => goalsApi.update(goalId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateOverview();
  return useMutation({ mutationFn: goalsApi.remove, onSuccess: invalidate });
}

export function usePlanSavings(planId: string) {
  return useQuery({
    queryKey: ["transactions", planId, "savings"],
    queryFn: () => transactionsApi.listSavings(planId),
    enabled: !!planId,
    select: (savings) => savings.toSorted((a, b) => b.date.localeCompare(a.date)),
  });
}
