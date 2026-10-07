import { Response } from "express";
import { returnJson } from "../services/apiService";

/**
 * Validates request data for subcategory creation and update.
 */
export function validateSubcategoryData(body: any, response: Response) {
  const { name, limit } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'name' is required.",
    });
    return null;
  }

  const parsedLimit = typeof limit === "number" ? limit : parseFloat(limit);
  if (isNaN(parsedLimit) || parsedLimit < 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'limit' must be a non-negative number.",
    });
    return null;
  }

  return {
    name: name.trim(),
    limit: parsedLimit.toString(),
  };
}
