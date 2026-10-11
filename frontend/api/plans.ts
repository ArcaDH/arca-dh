import type { Plan } from "@/types/plan";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const plansApi = {
  /** The plan the user picked as their current one. The backend answers 404 when there is none yet. */
  getCurrent: () => apiClient.get<Plan>(Endpoints.Plans.current()),
};
