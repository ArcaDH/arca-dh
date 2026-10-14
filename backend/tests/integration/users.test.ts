import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserHandler } from "../../src/handlers/users";
import { UserRepository } from "../../src/repositories/userRepository";
import { hashPassword } from "../../src/services/passwordService";
import { MessageCodes } from "../../src/handlers/codes";
import { createMockRequest, createMockResponse } from "./helpers";

vi.mock("../../src/repositories/userRepository", () => ({
  UserRepository: {
    createUser: vi.fn(),
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findById: vi.fn(),
    updateUser: vi.fn(),
  },
}));

describe("UserHandler (users.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser", () => {
    it("should return 400 if required fields are missing", async () => {
      const req = createMockRequest({
        body: { email: "test@example.com" }, // missing other fields
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_MISSING_DATA);
    });

    it("should return 400 if email format is invalid", async () => {
      const req = createMockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "invalid-email",
          username: "johndoe",
          password: "password123",
        },
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT);
    });

    it("should return 400 if password exceeds maximum length (> 18)", async () => {
      const req = createMockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          username: "johndoe",
          password: "a".repeat(19),
        },
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_INVALID_PASSWORD);
    });

    it("should return 400 if username exceeds maximum length (> 20)", async () => {
      const req = createMockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          username: "a".repeat(21),
          password: "password123",
        },
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_INVALID_USERNAME);
    });

    it("should return 400 if username is already taken", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce({ userId: 2 } as any);

      const req = createMockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          username: "johndoe",
          password: "password123",
        },
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_USERNAME_ALREADY_USED);
    });

    it("should return 400 if email is already used", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce({ userId: 2 } as any);

      const req = createMockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          username: "johndoe",
          password: "password123",
        },
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_EMAIL_ALREADY_USED);
    });

    it("should return 201 on successful user creation", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.createUser).mockResolvedValueOnce({ userId: 1 } as any);

      const req = createMockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          username: "johndoe",
          password: "password123",
        },
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe(MessageCodes.RESOURCE_CREATED);
      expect(UserRepository.createUser).toHaveBeenCalled();
    });

    it("should return 500 when repository fails on createUser", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.createUser).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          username: "johndoe",
          password: "password123",
        },
      });
      const res = createMockResponse();

      await UserHandler.createUser(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("connectUser", () => {
    it("should return 400 if body is missing / undefined", async () => {
      const req = createMockRequest();
      (req as any).body = undefined;
      const res = createMockResponse();

      await UserHandler.connectUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.LOGIN_MISSING_DATA);
    });

    it("should return 400 if login credentials are missing", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await UserHandler.connectUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.LOGIN_MISSING_DATA);
    });

    it("should return 404 if user not found by email", async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce(null);

      const req = createMockRequest({ body: { email: "notfound@example.com", password: "pwd" } });
      const res = createMockResponse();

      await UserHandler.connectUser(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe(MessageCodes.LOGIN_INCORRECT_DATA);
    });

    it("should return 404 if password verification fails", async () => {
      const hashed = await hashPassword("correctPassword");
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce({
        userId: 1,
        email: "john@example.com",
        password: hashed,
      } as any);

      const req = createMockRequest({ body: { email: "john@example.com", password: "wrongPassword" } });
      const res = createMockResponse();

      await UserHandler.connectUser(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe(MessageCodes.LOGIN_INCORRECT_DATA);
    });

    it("should return 200 with id and token on successful login", async () => {
      const password = "myPassword123";
      const hashed = await hashPassword(password);
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce({
        userId: 1,
        email: "john@example.com",
        password: hashed,
      } as any);

      const req = createMockRequest({ body: { email: "john@example.com", password: password } });
      const res = createMockResponse();

      await UserHandler.connectUser(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.token).toBeDefined();
    });

    it("should return 500 when repository throws on connectUser", async () => {
      vi.mocked(UserRepository.findByEmail).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ body: { email: "john@example.com", password: "pwd" } });
      const res = createMockResponse();

      await UserHandler.connectUser(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("patchUser", () => {
    it("should return 401 if unauthorized (no auth token)", async () => {
      const req = createMockRequest({ params: { id: "1" }, body: { username: "newname" } });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if auth token is invalid or malformed", async () => {
      const req = createMockRequest({
        params: { id: "1" },
        body: { username: "newname" },
        headers: { authorization: "Bearer invalid.malformed.jwt" },
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 403 if token userId mismatches requested id", async () => {
      const req = createMockRequest({
        params: { id: "2" }, // Requesting id 2
        body: { username: "newname" },
        tokenUserId: 1, // Authenticated as id 1
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(403);
    });

    it("should return 400 if updated password exceeds length", async () => {
      const req = createMockRequest({
        params: { id: "1" },
        body: { password: "a".repeat(19) },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_INVALID_PASSWORD);
    });

    it("should return 400 if updated username exceeds length", async () => {
      const req = createMockRequest({
        params: { id: "1" },
        body: { username: "a".repeat(21) },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_INVALID_USERNAME);
    });

    it("should return 400 if updated username is already taken", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce({ userId: 2 } as any);

      const req = createMockRequest({
        params: { id: "1" },
        body: { username: "existingUser" },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_USERNAME_ALREADY_USED);
    });

    it("should return 400 if updated email has invalid format", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: "1" },
        body: { email: "not-an-email" },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_INVALID_EMAIL_FORMAT);
    });

    it("should return 400 if updated email is already taken", async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce({ userId: 2 } as any);

      const req = createMockRequest({
        params: { id: "1" },
        body: { email: "taken@example.com" },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_CREATE_EMAIL_ALREADY_USED);
    });

    it("should return 404 if user not found in repository", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: "1" },
        body: { username: "newvaliduser" },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe(MessageCodes.USER_NOT_FOUND);
    });

    it("should return 200 with updated fields on success", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId: 1 } as any);
      vi.mocked(UserRepository.updateUser).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({
        params: { id: "1" },
        body: { email: "new@example.com", username: "newuser", password: "newpassword" },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.email).toBe("new@example.com");
      expect(res.body.username).toBe("newuser");
      expect(res.body.password).toBeUndefined(); // Password is stripped
    });

    it("should return 200 when updating only username or email without password", async () => {
      vi.mocked(UserRepository.findByUsername).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId: 1 } as any);
      vi.mocked(UserRepository.updateUser).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({
        params: { id: "1" },
        body: { username: "onlyusername" },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.username).toBe("onlyusername");
    });

    it("should return 200 when updating only email", async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId: 1 } as any);
      vi.mocked(UserRepository.updateUser).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({
        params: { id: "1" },
        body: { email: "onlyemail@example.com" },
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.email).toBe("onlyemail@example.com");
    });

    it("should return 500 when repository fails on patchUser", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({
        params: { id: "1" },
        body: {},
        tokenUserId: 1,
      });
      const res = createMockResponse();

      await UserHandler.patchUser(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("getUser", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: "1" } });
      const res = createMockResponse();

      await UserHandler.getUser(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if user ID is missing or invalid", async () => {
      const req = createMockRequest({ params: { id: "abc" }, tokenUserId: 1 });
      const res = createMockResponse();

      await UserHandler.getUser(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(MessageCodes.USER_NO_ID);
    });

    it("should return 404 if user not found", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: "99" }, tokenUserId: 1 });
      const res = createMockResponse();

      await UserHandler.getUser(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe(MessageCodes.USER_NOT_FOUND);
    });

    it("should return 200 with user data on success", async () => {
      const user = {
        userId: 1,
        username: "john",
        lastname: "Doe",
        firstname: "John",
        email: "john@example.com",
      };
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(user as any);

      const req = createMockRequest({ params: { id: "1" }, tokenUserId: 1 });
      const res = createMockResponse();

      await UserHandler.getUser(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        id: 1,
        username: "john",
        lastname: "Doe",
        firstname: "John",
        email: "john@example.com",
      });
    });

    it("should return 500 when repository fails on getUser", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { id: "1" }, tokenUserId: 1 });
      const res = createMockResponse();

      await UserHandler.getUser(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });
});
