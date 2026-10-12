import type { IncomeSource, IncomeSourceInput } from "@/types/incomeSource";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const incomeSourcesApi = {
  listByPlan: (planId: string) => apiClient.get<IncomeSource[]>(Endpoints.Plans.incomeSources(planId)),

  create: (planId: string, input: IncomeSourceInput) =>
    apiClient.post<IncomeSource>(Endpoints.Plans.incomeSources(planId), input),

  update: (id: string, input: IncomeSourceInput) =>
    apiClient.put<IncomeSource>(Endpoints.IncomeSources.byId(id), input),

  remove: (id: string) => apiClient.delete<void>(Endpoints.IncomeSources.byId(id)),
};
