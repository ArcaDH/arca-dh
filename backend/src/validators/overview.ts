import { Response } from "express";
import { isValidMonth } from "../services/monthlyDates";
import { returnJson } from "../services/apiService";
import { validatePlanScopedRequest } from "./planScope";

export const validateRequest = validatePlanScopedRequest;

export function validateMonthParam(query: any, response: Response): string | null {
  const month = query.month as string | undefined;

  if (!month || !isValidMonth(month)) {
    returnJson(response, 400, {
      code: 400,
      message: "Missing or invalid query parameter: 'month' is required and must be in YYYY-MM format.",
    });
    return null;
  }

  return month.trim();
}
