import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { isUuid } from "./uuid";
import { validatePlanScopedRequest } from "./planScope";

export const validateRequest = validatePlanScopedRequest;

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
