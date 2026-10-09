import { Response } from "express";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { PlanRepository } from "../repositories/planRepository";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function validateRequest(request: any, response: any): Promise<string | null> {
  if (!authorizeRequest(request, response)) return null;

  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  const planId = request.params.planId;
  if (typeof planId !== "string" || !UUID_REGEX.test(planId)) {
    returnJson(response, 404, { code: 404, message: "Plan not found" });
    return null;
  }

  const plan = await PlanRepository.findByIdAndUserId(planId, userId);
  if (!plan) {
    returnJson(response, 404, { code: 404, message: "Plan not found" });
    return null;
  }

  return planId;
}

export function validateMonthParam(query: any, response: Response): string | null {
  const month = query.month as string | undefined;

  if (!month || typeof month !== "string" || !MONTH_REGEX.test(month.trim())) {
    returnJson(response, 400, {
      code: 400,
      message: "Missing or invalid query parameter: 'month' is required and must be in YYYY-MM format.",
    });
    return null;
  }

  return month.trim();
}
