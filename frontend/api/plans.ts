import type { Plan, PlanInput } from "@/types/plan";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const plansApi = {
  list: () => apiClient.get<Plan[]>(Endpoints.Plans.list()),

  getCurrent: () => apiClient.get<Plan>(Endpoints.Plans.current()),

  setCurrent: (planId: string) => apiClient.put<Plan>(Endpoints.Plans.current(), { planId }),

  create: (input: PlanInput) => apiClient.post<Plan>(Endpoints.Plans.list(), input),

  update: (planId: string, input: PlanInput) => apiClient.put<Plan>(Endpoints.Plans.byId(planId), input),

  remove: (planId: string) => apiClient.delete<void>(Endpoints.Plans.byId(planId)),
};
