import jwt from "jsonwebtoken";
import { config } from "../config";

/** Name of the httpOnly cookie that carries the token. */
export const TOKEN_COOKIE = "arca_token";

export const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface TokenPayload {
  userId: number;
}

export const signToken = (userId: number): string =>
  jwt.sign({ userId } satisfies TokenPayload, config.TOKEN_SECRET, { expiresIn: TOKEN_LIFETIME_MS / 1000 });

/** @returns The user id in the token, or undefined when the token is invalid or expired. */
export function verifyToken(token: string): number | undefined {
  try {
    return (jwt.verify(token, config.TOKEN_SECRET) as TokenPayload).userId;
  } catch {
    return undefined;
  }
}
