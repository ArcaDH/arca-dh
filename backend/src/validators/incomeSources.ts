import { Response } from "express";
import { returnJson } from "../services/apiService";
import { validatePlanScopedRequest } from "./planScope";

export const validateRequest = validatePlanScopedRequest;

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
