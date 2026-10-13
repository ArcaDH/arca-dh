import { describe, it, expect } from "vitest";
import { MessageCodes, toMessage } from "../../src/handlers/codes";

describe("Codes Handler / Helper (codes.ts)", () => {
  it("should return correct message for USER_NO_ID", () => {
    expect(toMessage(MessageCodes.USER_NO_ID)).toBe("User ID was not specified.");
  });

  it("should return correct message for RESOURCE_CREATED", () => {
    expect(toMessage(MessageCodes.RESOURCE_CREATED)).toBe("Resource created successfully.");
  });

  it("should return correct message for USER_CREATE_MISSING_DATA", () => {
    expect(toMessage(MessageCodes.USER_CREATE_MISSING_DATA)).toBe("Invalid data: A required field is missing.");
  });

  it("should return correct message for USER_CREATE_INVALID_EMAIL_FORMAT", () => {
    expect(toMessage(MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT)).toBe("Email address format is invalid.");
  });

  it("should return correct message for USER_CREATE_INVALID_PASSWORD", () => {
    expect(toMessage(MessageCodes.USER_CREATE_INVALID_PASSWORD)).toBe("Password exceeds maximum length.");
  });

  it("should return correct message for USER_CREATE_INVALID_USERNAME", () => {
    expect(toMessage(MessageCodes.USER_CREATE_INVALID_USERNAME)).toBe("Username exceeds maximum length.");
  });

  it("should return correct message for USER_CREATE_EMAIL_ALREADY_USED", () => {
    expect(toMessage(MessageCodes.USER_CREATE_EMAIL_ALREADY_USED)).toBe("This email address is already in use.");
  });

  it("should return correct message for USER_CREATE_USERNAME_ALREADY_USED", () => {
    expect(toMessage(MessageCodes.USER_CREATE_USERNAME_ALREADY_USED)).toBe("This username is already taken.");
  });

  it("should return correct message for USER_NOT_FOUND", () => {
    expect(toMessage(MessageCodes.USER_NOT_FOUND)).toBe("The requested user was not found.");
  });

  it("should return correct message for LOGIN_MISSING_DATA", () => {
    expect(toMessage(MessageCodes.LOGIN_MISSING_DATA)).toBe("Invalid data: Required login fields missing.");
  });

  it("should return correct message for LOGIN_INCORRECT_DATA", () => {
    expect(toMessage(MessageCodes.LOGIN_INCORRECT_DATA)).toBe("Invalid email or password combination.");
  });

  it("should return correct message for USER_CREATE_INVALID_AGE", () => {
    expect(toMessage(MessageCodes.USER_CREATE_INVALID_AGE)).toBe("User must be over 15 years old.");
  });

  it("should return default message for unknown code", () => {
    expect(toMessage(9999 as unknown as MessageCodes)).toBe("An unexpected error occurred.");
  });
});
