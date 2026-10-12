import type { MonthlyOverview } from "@/types/overview";
import { apiClient } from "./ApiClient";
import { Endpoints } from "./endpoints";

export const overviewApi = {
  get: (planId: string, month: string) =>
    apiClient.get<MonthlyOverview>(`${Endpoints.Plans.overview(planId)}?${new URLSearchParams({ month })}`),
};
