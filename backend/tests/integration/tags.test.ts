import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagHandler } from "../../src/handlers/tags";
import { TagRepository } from "../../src/repositories/tagRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/tagRepository", () => ({
  TagRepository: {
    findByUserId: vi.fn(),
    findByIdAndUserId: vi.fn(),
    findByNameAndUserId: vi.fn(),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
  },
}));

describe("TagHandler (tags.ts)", () => {
  const validTagId = "223e4567-e89b-12d3-a456-426614174001";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTags", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await TagHandler.getTags(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if the token has no user id", async () => {
      const req = createMockRequest({ headers: { authorization: `Bearer ${generateTokenWithoutUserId()}` } });
      const res = createMockResponse();

      await TagHandler.getTags(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 200 with the tags of the user", async () => {
      const tags = [{ id: validTagId, name: "Groceries", color: "emerald" }];
      vi.mocked(TagRepository.findByUserId).mockResolvedValueOnce(tags as any);

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.getTags(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(tags);
      expect(TagRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it("should return 500 when the repository throws", async () => {
      vi.mocked(TagRepository.findByUserId).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.getTags(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("createTag", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest({ body: { name: "Food", color: "blue" } });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if the name is missing or blank", async () => {
      const req = createMockRequest({ body: { name: "   ", color: "blue" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 400 if the name is longer than 30 characters", async () => {
      const req = createMockRequest({ body: { name: "a".repeat(31), color: "blue" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("30");
    });

    it("should accept a name of exactly 30 characters", async () => {
      vi.mocked(TagRepository.findByNameAndUserId).mockResolvedValueOnce(null);
      vi.mocked(TagRepository.createTag).mockResolvedValueOnce({ id: validTagId } as any);

      const req = createMockRequest({ body: { name: "a".repeat(30), color: "blue" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(201);
    });

    it("should return 400 if the color is not one of the allowed colors", async () => {
      const req = createMockRequest({ body: { name: "Food", color: "purple" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("color");
    });

    it("should return 409 if the user already has a tag with that name", async () => {
      vi.mocked(TagRepository.findByNameAndUserId).mockResolvedValueOnce({ id: validTagId } as any);

      const req = createMockRequest({ body: { name: "food", color: "blue" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(409);
      expect(TagRepository.createTag).not.toHaveBeenCalled();
    });

    it("should return 409 if the database rejects a duplicate that slipped past the check", async () => {
      vi.mocked(TagRepository.findByNameAndUserId).mockResolvedValueOnce(null);
      vi.mocked(TagRepository.createTag).mockRejectedValueOnce(
        Object.assign(new Error("duplicate"), { code: "23505" }),
      );

      const req = createMockRequest({ body: { name: "Food", color: "blue" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(409);
    });

    it("should return 201 with the created tag, with the name trimmed", async () => {
      const created = { id: validTagId, name: "Food", color: "blue" };
      vi.mocked(TagRepository.findByNameAndUserId).mockResolvedValueOnce(null);
      vi.mocked(TagRepository.createTag).mockResolvedValueOnce(created as any);

      const req = createMockRequest({ body: { name: "  Food  ", color: "blue" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(created);
      expect(TagRepository.findByNameAndUserId).toHaveBeenCalledWith("Food", userId);
      expect(TagRepository.createTag).toHaveBeenCalledWith({ name: "Food", color: "blue", userId });
    });

    it("should return 500 when the repository throws", async () => {
      vi.mocked(TagRepository.findByNameAndUserId).mockResolvedValueOnce(null);
      vi.mocked(TagRepository.createTag).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ body: { name: "Food", color: "blue" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.createTag(req, res as any);
      expect(res.statusCode).toBe(500);
    });
  });

  describe("deleteTag", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest({ params: { id: validTagId } });
      const res = createMockResponse();

      await TagHandler.deleteTag(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if the id is not a valid UUID", async () => {
      const req = createMockRequest({ params: { id: "not-a-uuid" }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.deleteTag(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Tag not found" });
    });

    it("should return 404 if the tag does not exist or belongs to someone else", async () => {
      vi.mocked(TagRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validTagId }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.deleteTag(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(TagRepository.deleteTag).not.toHaveBeenCalled();
    });

    it("should return 204 and delete the tag on success", async () => {
      vi.mocked(TagRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validTagId } as any);
      vi.mocked(TagRepository.deleteTag).mockResolvedValueOnce(true);

      const req = createMockRequest({ params: { id: validTagId }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.deleteTag(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(TagRepository.findByIdAndUserId).toHaveBeenCalledWith(validTagId, userId);
      expect(TagRepository.deleteTag).toHaveBeenCalledWith(validTagId);
    });

    it("should return 500 when the repository throws", async () => {
      vi.mocked(TagRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validTagId } as any);
      vi.mocked(TagRepository.deleteTag).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { id: validTagId }, tokenUserId: userId });
      const res = createMockResponse();

      await TagHandler.deleteTag(req, res as any);
      expect(res.statusCode).toBe(500);
    });
  });
});
