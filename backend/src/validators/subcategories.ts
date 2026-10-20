import { Response } from "express";
import { returnJson } from "../services/apiService";

// Parse optional non-negative amount into string, null if absent, or undefined if invalid
function parseOptionalAmount(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value as string);
  return Number.isNaN(parsed) || parsed < 0 ? undefined : parsed.toString();
}

/** Validate request data for subcategory creation and update. */
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

/** Validate request body for monthly subcategory assignment. */
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
