import { Response } from "express";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { PlanRepository } from "../repositories/planRepository";
import { isUuid } from "./uuid";

/**
 * Validates auth, planId format, and plan ownership for plan-scoped income source requests.
 * Returns planId on success, or null if response was already sent.
 */
export async function validateRequest(request: any, response: any): Promise<string | null> {
  if (!authorizeRequest(request, response)) return null;

  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  const planId = request.params.planId;
  if (!isUuid(planId)) {
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

export const validatePlanRequest = validateRequest;

/**
 * Validates request data for income source creation and update.
 */
export function validateIncomeSourceData(body: any, response: Response) {
  const { name, monthlyAmount } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'name' is required.",
    });
    return null;
  }

  const parsedAmount = typeof monthlyAmount === "number" ? monthlyAmount : parseFloat(monthlyAmount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'monthlyAmount' must be a positive number.",
    });
    return null;
  }

  return {
    name: name.trim(),
    monthlyAmount: parsedAmount.toFixed(2),
  };
}
