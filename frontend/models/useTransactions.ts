import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/api/transactions";
import type { TransactionFilters } from "@/types/transaction";

// Every key starts with "transactions", so one invalidation reloads everything on the page
const transactionKeys = {
  all: ["transactions"] as const,
  list: (month: string, filters: TransactionFilters, limit: number) =>
    ["transactions", "list", month, filters, limit] as const,
  total: (month: string) => ["transactions", "total", month] as const,
  options: ["transactions", "form-options"] as const,
  payments: ["transactions", "monthly-payments"] as const,
};

export function useTransactionList(month: string, filters: TransactionFilters, limit: number) {
  return useQuery({
    queryKey: transactionKeys.list(month, filters, limit),
    queryFn: () => transactionsApi.list(month, filters, limit),
    placeholderData: keepPreviousData, // keep showing the old list while a new filter loads
  });
}

export function useMonthTotal(month: string) {
  return useQuery({ queryKey: transactionKeys.total(month), queryFn: () => transactionsApi.monthTotal(month) });
}

export function useFormOptions() {
  return useQuery({ queryKey: transactionKeys.options, queryFn: transactionsApi.formOptions });
}

export function useMonthlyPayments() {
  return useQuery({ queryKey: transactionKeys.payments, queryFn: transactionsApi.monthlyPayments });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stopRecurring }: { id: string; stopRecurring: boolean }) =>
      transactionsApi.remove(id, stopRecurring),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useStopMonthlyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.stopMonthlyPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.createTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.options }),
  });
}
