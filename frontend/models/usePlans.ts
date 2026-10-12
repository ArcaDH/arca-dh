import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plansApi } from "@/api/plans";
import type { PlanInput } from "@/types/plan";

const planKeys = {
  all: ["plans"] as const,
  list: ["plans", "list"] as const,
  current: ["plans", "current"] as const,
};

export function usePlans() {
  return useQuery({ queryKey: planKeys.list, queryFn: plansApi.list });
}

export function useCurrentPlan() {
  return useQuery({ queryKey: planKeys.current, queryFn: plansApi.getCurrent });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: PlanInput }) => plansApi.update(planId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  });
}

export function useSetCurrentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: plansApi.setCurrent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  });
}
