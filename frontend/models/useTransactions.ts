import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/api/transactions";
import type { NewTransaction } from "@/types/transaction";

// Every key starts with "transactions", so one invalidation reloads all of the page's data
const transactionKeys = {
  all: ["transactions"] as const,
  expenses: (planId: string | undefined, month: string) => ["transactions", planId, month] as const,
};

/** The expenses of the plan in one month. The old month stays on screen while the next one loads. */
export function useExpenses(planId: string | undefined, month: string) {
  return useQuery({
    queryKey: transactionKeys.expenses(planId, month),
    queryFn: () => transactionsApi.listExpenses(planId as string, month),
    enabled: !!planId,
    placeholderData: keepPreviousData,
  });
}

export function useCreateExpense(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewTransaction) => transactionsApi.create(planId, input),
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
