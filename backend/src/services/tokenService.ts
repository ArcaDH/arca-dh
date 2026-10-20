import jwt, { JwtPayload } from "jsonwebtoken";

export enum TokenValidationResult {
  SUCCESS,
  MISMATCH,
  INVALID,
}

export function generateToken(email: string, userId: number): string {
  const payload = {
    email: email,
    user: userId,
    created_at: Date.now(),
  };

  if (!process.env.TOKEN_SECRET) throw new Error("No token secret specified");

  // Note: does not include expiration, issuer, or audience claims
  return jwt.sign(payload, process.env.TOKEN_SECRET);
}

/** Validate JWT signature and optional email/userId claims. */
export function verifyToken(token: string, email: String = "", id: number = -1): TokenValidationResult {
  if (token.includes("Bearer ")) token = token.replace("Bearer ", "");

  const decoded = decodeToken(token);
  if (!decoded) return TokenValidationResult.INVALID;

  if (email && email.length > 0 && decoded.email !== email) {
    return TokenValidationResult.MISMATCH;
  }

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
    // Return undefined on invalid or expired token
    return undefined;
  }
}
