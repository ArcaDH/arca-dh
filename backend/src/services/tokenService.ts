import jwt, { JwtPayload } from "jsonwebtoken";

export enum TokenValidationResult {
  SUCCESS, // The token is valid
  MISMATCH, // The payload doesn't match request values
  INVALID, // This token is invalid
}

export function generateToken(email: string, userId: number): string {
  const payload = {
    email: email,
    user: userId,
    created_at: Date.now(),
  };

  if (!process.env.TOKEN_SECRET) throw new Error("No token secret specified");

  // Actually, doesn't handle an expiration, an issuer, or an audience.
  // It mights be done in the future to improve application security.
  return jwt.sign(payload, process.env.TOKEN_SECRET);
}

/**
 * Validate a JWT
 * @param token raw jwt
 * @param email if provided, will check that the payload contains this email
 * @param id if provided, will check that the payload contains this user id
 * @returns If this is a valid JWT
 */
export function verifyToken(token: string, email: String = "", id: number = -1): TokenValidationResult {
  if (token.includes("Bearer ")) token = token.replace("Bearer ", "");

  const decoded = decodeToken(token);
  if (!decoded) return TokenValidationResult.INVALID;

  // Email mismatch
  if (email && email.length > 0 && decoded.email !== email) {
    return TokenValidationResult.MISMATCH;
  }

  // User id missmatch
  if (id && id > 0 && decoded.user != id) {
    return TokenValidationResult.MISMATCH;
  }

  return TokenValidationResult.SUCCESS;
}

export function decodeToken(token: string): JwtPayload | undefined {
  const rawToken = token.replace("Bearer ", "");

  if (!process.env.TOKEN_SECRET) throw new Error("No token secret specified");

  try {
    return jwt.verify(rawToken, process.env.TOKEN_SECRET) as JwtPayload;
  } catch {
    // An invalid or expired token is a normal case: the request is simply not authorized
    return undefined;
  }
}
