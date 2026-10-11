import { useQuery } from "@tanstack/react-query";
import { plansApi } from "@/api/plans";

export const currentPlanKey = ["plans", "current"];

export function useCurrentPlan() {
  return useQuery({ queryKey: currentPlanKey, queryFn: plansApi.getCurrent });
}
