import { RequestHandler } from "express";
import { UnauthorizedError } from "../errors";
import { TOKEN_COOKIE, verifyToken } from "../lib/token";

/**
 * Lets the request through only with a valid token in the auth cookie.
 * The caller's id is then available to controllers as `res.locals.userId`.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const token: string | undefined = req.cookies[TOKEN_COOKIE];
  const userId = token ? verifyToken(token) : undefined;
  if (!userId) throw new UnauthorizedError("You need to log in.");

  res.locals.userId = userId;
  next();
};
