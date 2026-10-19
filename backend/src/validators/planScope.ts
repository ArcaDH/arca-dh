import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { PlanRepository } from "../repositories/planRepository";
import { isUuid } from "./uuid";

/**
 * Validates auth, planId format, and plan ownership for every request under /plans/:planId.
 * Returns planId on success, or null if the response was already sent.
 */
export async function validatePlanScopedRequest(request: any, response: any): Promise<string | null> {
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
