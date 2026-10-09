import { Request, Response } from "express";
import { OverviewRepository } from "../repositories/overviewRepository";
import { validateRequest, validateMonthParam } from "../validators/overview";
import { returnJson } from "../services/apiService";

export namespace OverviewHandler {
  export async function getOverview(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const month = validateMonthParam(request.query, response);
      if (month == null) return;

      const overview = await OverviewRepository.getMonthlyOverview(planId, month);
      return returnJson(response, 200, overview);
    } catch (error) {
      console.error("Error in getOverview:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
