import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { PlanRepository } from "../repositories/planRepository";
import { isUuid } from "./uuid";

/**
 * Validates auth, planId format, and plan ownership for plan-scoped monthly payment requests.
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

/**
 * Validates auth, the id format, and that the monthly payment belongs to the logged-in user.
 * Returns the id on success, or null if response was already sent.
 */
export async function validateExistingRequest(request: any, response: any): Promise<string | null> {
  if (!authorizeRequest(request, response)) return null;

  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  const id = request.params.id;
  if (!isUuid(id)) {
    returnJson(response, 404, { code: 404, message: "Monthly payment not found" });
    return null;
  }

  const payment = await MonthlyPaymentRepository.findByIdAndUserId(id, userId);
  if (!payment) {
    returnJson(response, 404, { code: 404, message: "Monthly payment not found" });
    return null;
  }

  return id;
}
