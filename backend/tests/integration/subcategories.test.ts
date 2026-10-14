import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubcategoryHandler } from "../../src/handlers/subcategories";
import { SubcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { CategoryRepository } from "../../src/repositories/categoryRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/subcategoryRepository", () => ({
  SubcategoryRepository: {
    findSubcategoriesByCategoryId: vi.fn(),
    createSubcategory: vi.fn(),
    findSubcategoryByIdAndUserId: vi.fn(),
    updateSubcategory: vi.fn(),
    deleteSubcategory: vi.fn(),
  },
}));

vi.mock("../../src/repositories/categoryRepository", () => ({
  CategoryRepository: {
    findCategoryByIdAndUserId: vi.fn(),
  },
}));

describe("SubcategoryHandler (subcategories.ts)", () => {
  const validCategoryId = "123e4567-e89b-12d3-a456-426614174000";
  const validSubcategoryId = "223e4567-e89b-12d3-a456-426614174001";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSubcategories", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validCategoryId } });
      const res = createMockResponse();

      await SubcategoryHandler.getSubcategories(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validCategoryId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await SubcategoryHandler.getSubcategories(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if category not found for user", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validCategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await SubcategoryHandler.getSubcategories(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Category not found" });
    });

    it("should return 200 with subcategories on success", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const subcategories = [{ id: validSubcategoryId, name: "Dining out", limit: "150", categoryId: validCategoryId }];
      vi.mocked(SubcategoryRepository.findSubcategoriesByCategoryId).mockResolvedValueOnce(subcategories as any);

      const req = createMockRequest({ params: { id: validCategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await SubcategoryHandler.getSubcategories(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(subcategories);
      expect(SubcategoryRepository.findSubcategoriesByCategoryId).toHaveBeenCalledWith(validCategoryId);
    });

    it("should return 500 when repository fails on getSubcategories", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(SubcategoryRepository.findSubcategoriesByCategoryId).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { id: validCategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await SubcategoryHandler.getSubcategories(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("createSubcategory", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validCategoryId }, body: { name: "Dining", limit: 100 } });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validCategoryId },
        headers: { authorization: `Bearer ${token}` },
        body: { name: "Dining", limit: 100 },
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if category not found for user", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", limit: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Category not found" });
    });

    it("should return 400 if validation fails (e.g. empty name)", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "", limit: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 400 if body is missing or name is not a string", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        tokenUserId: userId,
      });
      (req as any).body = undefined;
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(400);

      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const req2 = createMockRequest({
        params: { id: validCategoryId },
        body: { name: 12345, limit: 100 },
        tokenUserId: userId,
      });
      const res2 = createMockResponse();
      await SubcategoryHandler.createSubcategory(req2, res2 as any);
      expect(res2.statusCode).toBe(400);
    });

    it("should return 400 if limit is negative or NaN", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", limit: -10 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("limit");

      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const req2 = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", limit: "not-a-number" },
        tokenUserId: userId,
      });
      const res2 = createMockResponse();
      await SubcategoryHandler.createSubcategory(req2, res2 as any);
      expect(res2.statusCode).toBe(400);
    });

    it("should accept string limit and parse it correctly", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const created = { id: validSubcategoryId, name: "Dining", limit: "150", categoryId: validCategoryId };
      vi.mocked(SubcategoryRepository.createSubcategory).mockResolvedValueOnce(created as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", limit: "150" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(created);
    });

    it("should return 201 with created subcategory on success", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const created = { id: validSubcategoryId, name: "Dining", limit: "100", categoryId: validCategoryId };
      vi.mocked(SubcategoryRepository.createSubcategory).mockResolvedValueOnce(created as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", limit: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(created);
      expect(SubcategoryRepository.createSubcategory).toHaveBeenCalledWith({
        name: "Dining",
        limit: "100",
        categoryId: validCategoryId,
      });
    });

    it("should return 500 when repository fails on create", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(SubcategoryRepository.createSubcategory).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", limit: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("updateSubcategory", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validSubcategoryId }, body: { name: "Fast Food", limit: 80 } });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validSubcategoryId },
        headers: { authorization: `Bearer ${token}` },
        body: { name: "Fast Food", limit: 80 },
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if subcategory not found for user", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "Fast Food", limit: 80 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Subcategory not found" });
    });

    it("should return 400 if validation fails on update", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "", limit: 80 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 200 with updated subcategory on success", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      const updated = { id: validSubcategoryId, name: "Fast Food", limit: "80" };
      vi.mocked(SubcategoryRepository.updateSubcategory).mockResolvedValueOnce(updated as any);

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "Fast Food", limit: 80 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updated);
      expect(SubcategoryRepository.updateSubcategory).toHaveBeenCalledWith(validSubcategoryId, {
        name: "Fast Food",
        limit: "80",
      });
    });

    it("should return 500 when repository fails on update", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      vi.mocked(SubcategoryRepository.updateSubcategory).mockRejectedValueOnce(new Error("Update failed"));

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "Fast Food", limit: 80 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("deleteSubcategory", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validSubcategoryId } });
      const res = createMockResponse();

      await SubcategoryHandler.deleteSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validSubcategoryId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await SubcategoryHandler.deleteSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if subcategory not found for user", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validSubcategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await SubcategoryHandler.deleteSubcategory(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Subcategory not found" });
    });

    it("should return 204 on successful delete", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      vi.mocked(SubcategoryRepository.deleteSubcategory).mockResolvedValueOnce(true);

      const req = createMockRequest({ params: { id: validSubcategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await SubcategoryHandler.deleteSubcategory(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(SubcategoryRepository.deleteSubcategory).toHaveBeenCalledWith(validSubcategoryId);
    });

    it("should return 500 when repository fails on delete", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      vi.mocked(SubcategoryRepository.deleteSubcategory).mockRejectedValueOnce(new Error("Delete failed"));

      const req = createMockRequest({ params: { id: validSubcategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await SubcategoryHandler.deleteSubcategory(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });
});
