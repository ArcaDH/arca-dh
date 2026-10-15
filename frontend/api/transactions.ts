import type { NewSaving, NewTransaction, Transaction } from "@/types/transaction";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const transactionsApi = {
  /** The expenses and savings of one plan in one month ("YYYY-MM"), newest first. */
  listByMonth: (planId: string, month: string) => {
    const params = new URLSearchParams({ month });
    return apiClient.get<Transaction[]>(`${Endpoints.Plans.transactions(planId)}?${params}`);
  },

  listSavings: (planId: string) => {
    const params = new URLSearchParams({ type: "SAVING" });
    return apiClient.get<Transaction[]>(`${Endpoints.Plans.transactions(planId)}?${params}`);
  },

  create: (planId: string, input: NewTransaction | NewSaving) =>
    apiClient.post<Transaction>(Endpoints.Plans.transactions(planId), input),

  remove: (id: string) => apiClient.delete<void>(Endpoints.Transactions.byId(id)),
};
