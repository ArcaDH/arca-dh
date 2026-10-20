import { Response } from "express";
import { returnJson } from "../services/apiService";
import { validatePlanScopedRequest } from "./planScope";

export const validateRequest = validatePlanScopedRequest;

export const validatePlanRequest = validateRequest;

/** Validate request data for category creation and update. */
export function validateCategoryData(body: any, response: Response) {
  const { name, maxBudget } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'name' is required.",
    });
    return null;
  }

  const parsedBudget = typeof maxBudget === "number" ? maxBudget : parseFloat(maxBudget);
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
