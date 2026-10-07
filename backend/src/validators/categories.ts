import { Response } from "express";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { PlanRepository } from "../repositories/planRepository";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validates auth, planId format, and plan ownership for plan-scoped category requests.
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

export const validatePlanRequest = validateRequest;

/**
 * Validates request data for category creation and update.
 */
export function validateCategoryData(body: any, response: Response) {
  const { name, maxBudget } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'name' is required.",
    });
    return null;
  }

  const parsedBudget =
    typeof maxBudget === "number" ? maxBudget : parseFloat(maxBudget);
  if (isNaN(parsedBudget) || parsedBudget < 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'maxBudget' must be a non-negative number.",
    });
    return null;
  }

  return {
    name: name.trim(),
    maxBudget: parsedBudget.toString(),
  };
}
