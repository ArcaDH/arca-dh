import { Response, Request, NextFunction } from "express";
import { MessageCodes, toMessage } from "../handlers/codes";
import { decodeToken, TokenValidationResult, verifyToken } from "./tokenService";
import { AppError } from "../data/app_error";

/** Send a status code and optional message to the client. */
export function returnCode(response: Response, code: number, message: MessageCodes | undefined = undefined) {
  response.status(code);

  if (message !== undefined) {
    response.json({
      code: message,
      message: toMessage(message),
    });
  } else {
    response.send();
  }
}

/** Send a JSON response with the given status code. */
export function returnJson(response: Response, code: number, content: any) {
  response.status(code).json(content);
}

export function authorizeRequestWithoutAnswer(request: Request, email: String = "", id: number = -1): boolean {
  const token = request.headers.authorization;

  if (!token || token.length == 0) {
    return false;
  }

  return verifyToken(token, email, id) == TokenValidationResult.SUCCESS;
}

/** Validate request authorization and send an error response if unauthorized. */
export function authorizeRequest(request: Request, response: Response, email: String = "", id: number = -1): boolean {
  const token = request.headers.authorization;

  if (!token || token.length == 0) {
    returnCode(response, 401);
    return false;
  }

  const result = verifyToken(token, email, id);

  if (result == TokenValidationResult.SUCCESS) {
    return true;
  } else if (result == TokenValidationResult.MISMATCH) {
    returnCode(response, 403);
    return false;
  } else {
    returnCode(response, 401);
    return false;
  }
}

/** Extract the user id from the authorization token. */
export function userIdFromToken(request: Request): number | undefined {
  const token = request.headers.authorization;
  if (!token || token.length == 0) return undefined;

  return decodeToken(token)?.user;
}

/** Extract the email from the authorization token. */
export function emailFromToken(request: Request): string | undefined {
  const token = request.headers.authorization;
  if (!token || token.length == 0) return undefined;

  return decodeToken(token)?.email;
}

export function exceptionMiddleware(err: any, req: Request, response: Response, next: NextFunction) {
  if (err instanceof AppError) {
    returnCode(response, err.code, err.message);
  }
}
