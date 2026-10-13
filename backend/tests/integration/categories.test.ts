import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryHandler } from "../../src/handlers/categories";
import { CategoryRepository } from "../../src/repositories/categoryRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/categoryRepository", () => ({
  CategoryRepository: {
    findCategoriesByPlanId: vi.fn(),
    createCategory: vi.fn(),
    findCategoryByIdAndUserId: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

describe("CategoryHandler (categories.ts)", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const validCategoryId = "223e4567-e89b-12d3-a456-426614174001";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should return 401 if request is not authenticated", async () => {
      const req = createMockRequest({ params: { planId: validPlanId } });
      const res = createMockResponse();

      await CategoryHandler.getCategories(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if planId is not a valid UUID", async () => {
      const req = createMockRequest({ params: { planId: "not-a-uuid" }, tokenUserId: userId });
      const res = createMockResponse();

      await CategoryHandler.getCategories(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Plan not found" });
    });

    it("should return 404 if plan does not belong to the user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await CategoryHandler.getCategories(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Plan not found" });
    });

    it("should return 200 with categories list on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({
        id: validPlanId,
        userId: userId,
        name: "Monthly Plan",
        month: "2026-10",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const mockCategories = [{ id: validCategoryId, name: "Food", maxBudget: "500", budgetPlanId: validPlanId }];
      vi.mocked(CategoryRepository.findCategoriesByPlanId).mockResolvedValueOnce(mockCategories as any);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await CategoryHandler.getCategories(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockCategories);
      expect(CategoryRepository.findCategoriesByPlanId).toHaveBeenCalledWith(validPlanId);
    });

    it("should return 500 when repository throws an unexpected error", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(CategoryRepository.findCategoriesByPlanId).mockRejectedValueOnce(new Error("DB failure"));

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await CategoryHandler.getCategories(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("createCategory", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: { name: "Food", maxBudget: 200 } });
      const res = createMockResponse();

      await CategoryHandler.createCategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if category name is missing or invalid", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "", maxBudget: 200 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.createCategory(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 400 if maxBudget is negative or invalid", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Food", maxBudget: -50 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.createCategory(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("maxBudget");
    });

    it("should return 201 with created category on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const createdCategory = {
        id: validCategoryId,
        name: "Food",
        maxBudget: "200",
        budgetPlanId: validPlanId,
      };
      vi.mocked(CategoryRepository.createCategory).mockResolvedValueOnce(createdCategory as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: " Food ", maxBudget: 200 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.createCategory(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(createdCategory);
      expect(CategoryRepository.createCategory).toHaveBeenCalledWith({
        name: "Food",
        maxBudget: "200",
        budgetPlanId: validPlanId,
      });
    });

    it("should return 500 when repository fails on create", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(CategoryRepository.createCategory).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Food", maxBudget: 200 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.createCategory(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("updateCategory", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validCategoryId }, body: { name: "Updated" } });
      const res = createMockResponse();

      await CategoryHandler.updateCategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId during update", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validCategoryId },
        headers: { authorization: `Bearer ${token}` },
        body: { name: "Updated", maxBudget: 300 },
      });
      const res = createMockResponse();

      await CategoryHandler.updateCategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if category not found for user", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Updated", maxBudget: 300 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.updateCategory(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Category not found" });
    });

    it("should return 400 if validation fails during update", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "", maxBudget: 300 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.updateCategory(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 200 with updated category on success", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const updatedCategory = { id: validCategoryId, name: "Groceries", maxBudget: "350" };
      vi.mocked(CategoryRepository.updateCategory).mockResolvedValueOnce(updatedCategory as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Groceries", maxBudget: "350" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.updateCategory(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updatedCategory);
      expect(CategoryRepository.updateCategory).toHaveBeenCalledWith(validCategoryId, {
        name: "Groceries",
        maxBudget: "350",
      });
    });

    it("should return 500 when repository fails on update", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(CategoryRepository.updateCategory).mockRejectedValueOnce(new Error("Update failed"));

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Groceries", maxBudget: 350 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await CategoryHandler.updateCategory(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("deleteCategory", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validCategoryId } });
      const res = createMockResponse();

      await CategoryHandler.deleteCategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId during delete", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validCategoryId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await CategoryHandler.deleteCategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if category not found for user", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validCategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await CategoryHandler.deleteCategory(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Category not found" });
    });

    it("should return 204 on successful delete", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(CategoryRepository.deleteCategory).mockResolvedValueOnce(true);

      const req = createMockRequest({ params: { id: validCategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await CategoryHandler.deleteCategory(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(CategoryRepository.deleteCategory).toHaveBeenCalledWith(validCategoryId);
    });

    it("should return 500 when repository throws on delete", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(CategoryRepository.deleteCategory).mockRejectedValueOnce(new Error("Delete failed"));

      const req = createMockRequest({ params: { id: validCategoryId }, tokenUserId: userId });
      const res = createMockResponse();

      await CategoryHandler.deleteCategory(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });
});
