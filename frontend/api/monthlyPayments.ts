import type { MonthlyPayment } from "@/types/monthlyPayment";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const monthlyPaymentsApi = {
  /** The active monthly payments of one plan, oldest first, each with the day it is next due. */
  listByPlan: (planId: string) => apiClient.get<MonthlyPayment[]>(Endpoints.Plans.monthlyPayments(planId)),

  /** Stops a monthly payment. The transactions it already made are kept. */
  remove: (id: string) => apiClient.delete<void>(Endpoints.MonthlyPayments.byId(id)),
};
