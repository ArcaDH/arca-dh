import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { monthlyPaymentsApi } from "@/api/monthlyPayments";

const monthlyPaymentKeys = {
  all: ["monthlyPayments"] as const,
  byPlan: (planId: string | undefined) => ["monthlyPayments", planId] as const,
};

export function useMonthlyPayments(planId: string | undefined) {
  return useQuery({
    queryKey: monthlyPaymentKeys.byPlan(planId),
    queryFn: () => monthlyPaymentsApi.listByPlan(planId as string),
    enabled: !!planId,
  });
}

export function useStopMonthlyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: monthlyPaymentsApi.remove,
    // The transactions it made stay, but they are no longer marked as repeating
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: monthlyPaymentKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]),
  });
}
