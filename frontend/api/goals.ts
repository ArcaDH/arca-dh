import type { SavingsGoal, SavingsGoalInput } from "@/types/goal";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const goalsApi = {
  listByPlan: (planId: string) => apiClient.get<SavingsGoal[]>(Endpoints.Plans.goals(planId)),

  create: (planId: string, input: SavingsGoalInput) =>
    apiClient.post<SavingsGoal>(Endpoints.Plans.goals(planId), input),

  update: (id: string, input: SavingsGoalInput) => apiClient.put<SavingsGoal>(Endpoints.Goals.byId(id), input),

  remove: (id: string) => apiClient.delete<void>(Endpoints.Goals.byId(id)),
};
