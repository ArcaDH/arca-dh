import { Request, Response } from "express";
import { OverviewRepository } from "../repositories/overviewRepository";
import { validateRequest, validateMonthParam } from "../validators/overview";
import { returnJson } from "../services/apiService";
import { MonthlyPaymentService } from "../services/monthlyPaymentService";

export namespace OverviewHandler {
  export async function getOverview(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const month = validateMonthParam(request.query, response);
      if (month == null) return;

      // Monthly payments that are due get their transactions first, so the spending adds up whichever page is opened first
      await MonthlyPaymentService.ensureGenerated(planId);

      const overview = await OverviewRepository.getMonthlyOverview(planId, month);
      return returnJson(response, 200, overview);
    } catch (error) {
      console.error("Error in getOverview:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
