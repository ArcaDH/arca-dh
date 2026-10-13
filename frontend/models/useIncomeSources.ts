import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { incomeSourcesApi } from "@/api/incomeSources";
import type { IncomeSourceInput } from "@/types/incomeSource";

const incomeKey = (planId: string) => ["plans", planId, "income-sources"];

export function useIncomeSources(planId: string) {
  return useQuery({ queryKey: incomeKey(planId), queryFn: () => incomeSourcesApi.listByPlan(planId) });
}

export function useCreateIncomeSource(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: IncomeSourceInput) => incomeSourcesApi.create(planId, input),
    // The overview's income total depends on the income sources
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: incomeKey(planId) }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
      ]),
  });
}

export function useUpdateIncomeSource(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: IncomeSourceInput }) => incomeSourcesApi.update(id, input),
    // The overview's income total depends on the income sources
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: incomeKey(planId) }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
      ]),
  });
}

export function useDeleteIncomeSource(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: incomeSourcesApi.remove,
    // The overview's income total depends on the income sources
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: incomeKey(planId) }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
      ]),
  });
}
