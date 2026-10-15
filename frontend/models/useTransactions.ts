import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/api/transactions";
import type { NewSaving, NewTransaction } from "@/types/transaction";

// Every key starts with "transactions", so one invalidation reloads all of the page's data
const transactionKeys = {
  all: ["transactions"] as const,
  expenses: (planId: string | undefined, month: string) => ["transactions", planId, month] as const,
};

/** The expenses and savings of the plan in one month. The old month stays on screen while the next one loads. */
export function useMonthTransactions(planId: string | undefined, month: string) {
  return useQuery({
    queryKey: transactionKeys.expenses(planId, month),
    queryFn: () => transactionsApi.listByMonth(planId as string, month),
    enabled: !!planId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewTransaction | NewSaving) => transactionsApi.create(planId, input),
    // The overview's spending per category depends on the transactions too
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
      ]),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.remove,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["overview"] }),
      ]),
  });
}
