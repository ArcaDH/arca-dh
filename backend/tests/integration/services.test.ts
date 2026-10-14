import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateToken, verifyToken, decodeToken, TokenValidationResult } from "../../src/services/tokenService";
import { hashPassword, verifyPassword } from "../../src/services/passwordService";

describe("Token and Password Services", () => {
  const originalSecret = process.env.TOKEN_SECRET;
  const testSecret = "test-secret-key-for-services-unit-tests";

  beforeEach(() => {
    process.env.TOKEN_SECRET = testSecret;
  });

  afterEach(() => {
    process.env.TOKEN_SECRET = originalSecret;
  });

  describe("tokenService", () => {
    it("should generate a valid token and decode it", () => {
      const email = "test@example.com";
      const userId = 42;
      const token = generateToken(email, userId);

      expect(typeof token).toBe("string");
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.email).toBe(email);
      expect(decoded?.user).toBe(userId);
    });

    it("should throw error if TOKEN_SECRET is missing during generation", () => {
      delete process.env.TOKEN_SECRET;
      expect(() => generateToken("test@example.com", 1)).toThrow("No token secret specified");
    });

    it("should throw error if TOKEN_SECRET is missing during decode", () => {
      delete process.env.TOKEN_SECRET;
      expect(() => decodeToken("some.token.value")).toThrow("No token secret specified");
    });

    it("should return undefined from decodeToken if token is invalid or malformed", () => {
      const result = decodeToken("invalid.token.here");
      expect(result).toBeUndefined();
    });

    it("should decode token with and without Bearer prefix", () => {
      const token = generateToken("test@example.com", 1);
      const decodedWithoutBearer = decodeToken(token);
      const decodedWithBearer = decodeToken(`Bearer ${token}`);

      expect(decodedWithoutBearer).toEqual(decodedWithBearer);
    });

    it("should return INVALID for malformed token in verifyToken", () => {
      const result = verifyToken("invalid-token");
      expect(result).toBe(TokenValidationResult.INVALID);
    });

    it("should return MISMATCH if email does not match", () => {
      const token = generateToken("user@example.com", 1);
      const result = verifyToken(token, "other@example.com");
      expect(result).toBe(TokenValidationResult.MISMATCH);
    });

    it("should return MISMATCH if userId does not match", () => {
      const token = generateToken("user@example.com", 1);
      const result = verifyToken(token, "user@example.com", 999);
      expect(result).toBe(TokenValidationResult.MISMATCH);
    });

    it("should return SUCCESS when token is valid and matches email and userId", () => {
      const token = generateToken("user@example.com", 1);
      const resultWithBearer = verifyToken(`Bearer ${token}`, "user@example.com", 1);
      expect(resultWithBearer).toBe(TokenValidationResult.SUCCESS);

      const resultWithoutChecks = verifyToken(token);
      expect(resultWithoutChecks).toBe(TokenValidationResult.SUCCESS);
    });
  });

  describe("passwordService", () => {
    it("should hash a password and verify it correctly", async () => {
      const plainPassword = "SuperSecretPassword123!";
      const hashed = await hashPassword(plainPassword);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(plainPassword);

      const isValid = await verifyPassword(hashed, plainPassword);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword(hashed, "WrongPassword!");
      expect(isInvalid).toBe(false);
    });
  });
});
