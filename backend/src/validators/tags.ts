import { Response } from "express";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { TAG_COLORS } from "../db/schema";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const MAX_TAG_NAME_LENGTH = 30;
export const MAX_TAGS_PER_TRANSACTION = 5;

/**
 * Validates auth and returns the id of the logged-in user, or null if the response was already sent.
 */
export function validateRequest(request: any, response: any): number | null {
  if (!authorizeRequest(request, response)) return null;

  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  return userId;
}

/**
 * Validates the id of a tag in the path. Returns the id, or null if the response was already sent.
 */
export function validateTagId(request: any, response: any): string | null {
  const id = request.params.id;
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    returnJson(response, 404, { code: 404, message: "Tag not found" });
    return null;
  }
  return id;
}

/**
 * Validates request data for tag creation.
 */
export function validateTagData(body: any, response: Response) {
  const { name, color } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'name' is required.",
    });
    return null;
  }

  if (name.trim().length > MAX_TAG_NAME_LENGTH) {
    returnJson(response, 400, {
      code: 400,
      message: `Invalid input: 'name' can be at most ${MAX_TAG_NAME_LENGTH} characters.`,
    });
    return null;
  }

  if (typeof color !== "string" || !(TAG_COLORS as readonly string[]).includes(color)) {
    returnJson(response, 400, {
      code: 400,
      message: `Invalid input: 'color' must be one of ${TAG_COLORS.join(", ")}.`,
    });
    return null;
  }

  return {
    name: name.trim(),
    color: color as (typeof TAG_COLORS)[number],
  };
}
