import type { NewTransaction, Transaction } from "@/types/transaction";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const transactionsApi = {
  /** The expenses of one plan in one month ("YYYY-MM"), newest first. */
  listExpenses: (planId: string, month: string) => {
    const params = new URLSearchParams({ month, type: "EXPENSE" });
    return apiClient.get<Transaction[]>(`${Endpoints.Plans.transactions(planId)}?${params}`);
  },

  create: (planId: string, input: NewTransaction) =>
    apiClient.post<Transaction>(Endpoints.Plans.transactions(planId), input),

  remove: (id: string) => apiClient.delete<void>(Endpoints.Transactions.byId(id)),
};
