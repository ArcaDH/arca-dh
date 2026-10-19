import { Response } from "express";
import { returnJson } from "../services/apiService";

// Parse a value that may be absent, null, or empty into a non-negative amount string, or null for "none".
// Returns undefined when the value is present but not a valid non-negative number.
function parseOptionalAmount(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value as string);
  return Number.isNaN(parsed) || parsed < 0 ? undefined : parsed.toString();
}

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

  const normalizedTarget = parseOptionalAmount(target);
  if (normalizedTarget === undefined) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'target' must be a non-negative number.",
    });
    return null;
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
  const parsedAssigned = parseOptionalAmount(body?.assigned);
  if (parsedAssigned === undefined || parsedAssigned === null) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'assigned' must be a non-negative number.",
    });
    return null;
  }

  return { assigned: parsedAssigned };
}
