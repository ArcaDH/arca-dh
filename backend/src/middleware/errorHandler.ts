import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors";
import { log } from "../lib/logger";

const STATUS_BY_ERROR = new Map<Function, number>([
  [UnauthorizedError, 401],
  [NotFoundError, 404],
  [ConflictError, 409],
]);

/**
 * Turns every error into a JSON response `{ message }` with a fitting status code.
 * Express 5 sends errors thrown or rejected in async handlers here automatically.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);

  const status = STATUS_BY_ERROR.get(err?.constructor);
  if (status) return res.status(status).json({ message: err.message });

  // Invalid request body: report the first problem
  if (err instanceof ZodError) {
    const [issue] = err.issues;
    const missingBody = issue.code === "invalid_type" && issue.path.length === 0;
    return res.status(400).json({ message: missingBody ? "The request needs a JSON body." : issue.message });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "The request body is not valid JSON." });
  }

  log.error(err);
  res.status(500).json({ message: "An unexpected error occurred." });
};
