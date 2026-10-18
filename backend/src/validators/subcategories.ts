import { Response } from "express";
import { returnJson } from "../services/apiService";

/**
 * Validates request data for subcategory creation and update.
 * A subcategory needs only a name. `target` is the optional monthly funding goal:
 * absent, null, or empty means "no target"; when given it must be a non-negative number.
 */
export function validateSubcategoryData(body: any, response: Response) {
  const { name, target } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'name' is required.",
    });
    return null;
  }

  let normalizedTarget: string | null = null;
  if (target !== undefined && target !== null && target !== "") {
    const parsedTarget = typeof target === "number" ? target : parseFloat(target);
    if (isNaN(parsedTarget) || parsedTarget < 0) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid input: 'target' must be a non-negative number.",
      });
      return null;
    }
    normalizedTarget = parsedTarget.toString();
  }

  return {
    name: name.trim(),
    target: normalizedTarget,
  };
}

/**
 * Validates the body for setting a subcategory's assigned money in a month.
 * Requires a non-negative `assigned` amount. The month comes from the route param.
 */
export function validateAssignmentData(body: any, response: Response) {
  const { assigned } = body || {};

  const parsedAssigned = typeof assigned === "number" ? assigned : parseFloat(assigned);
  if (isNaN(parsedAssigned) || parsedAssigned < 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'assigned' must be a non-negative number.",
    });
    return null;
  }

  return { assigned: parsedAssigned.toString() };
}

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Validates a "YYYY-MM" month string (route param or body field).
 */
export function isValidMonth(month: unknown): month is string {
  return typeof month === "string" && MONTH_REGEX.test(month);
}
