import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { overviewApi } from "@/api/overview";

// Budget and spending of the plan in one month.
export function useOverview(planId: string | undefined, month: string) {
  return useQuery({
    queryKey: ["overview", planId, month],
    queryFn: () => overviewApi.get(planId as string, month),
    enabled: !!planId,
    placeholderData: keepPreviousData,
  });
}
