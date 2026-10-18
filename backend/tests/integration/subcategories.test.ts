import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubcategoryHandler } from "../../src/handlers/subcategories";
import { SubcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { SubcategoryAssignmentRepository } from "../../src/repositories/subcategoryAssignmentRepository";
import { CategoryRepository } from "../../src/repositories/categoryRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
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

vi.mock("../../src/repositories/subcategoryAssignmentRepository", () => ({
  SubcategoryAssignmentRepository: {
    setAssigned: vi.fn(),
    setAssignedMany: vi.fn(),
    setAssignedEach: vi.fn(),
    findOwnedWithAssignment: vi.fn(),
    findPlanSubcategoriesWithAssignment: vi.fn(),
  },
}));

vi.mock("../../src/repositories/categoryRepository", () => ({
  CategoryRepository: {
    findCategoryByIdAndUserId: vi.fn(),
  },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

describe("SubcategoryHandler (subcategories.ts)", () => {
  const validCategoryId = "123e4567-e89b-12d3-a456-426614174000";
  const validSubcategoryId = "223e4567-e89b-12d3-a456-426614174001";
  const validPlanId = "323e4567-e89b-12d3-a456-426614174002";
  const userId = 1;
  const month = "2026-10";

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
      const subcategories = [
        { id: validSubcategoryId, name: "Dining out", target: "150", categoryId: validCategoryId },
      ];
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
      const req = createMockRequest({ params: { id: validCategoryId }, body: { name: "Dining" } });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if category not found for user", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining" },
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
        body: { name: "" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 400 if target is negative", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", target: -10 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("target");
    });

    it("should create with no target when target is omitted", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const created = { id: validSubcategoryId, name: "Dining", target: null, categoryId: validCategoryId };
      vi.mocked(SubcategoryRepository.createSubcategory).mockResolvedValueOnce(created as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(created);
      expect(SubcategoryRepository.createSubcategory).toHaveBeenCalledWith({
        name: "Dining",
        target: null,
        categoryId: validCategoryId,
      });
    });

    it("should create with a target when provided", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      const created = { id: validSubcategoryId, name: "Dining", target: "300", categoryId: validCategoryId };
      vi.mocked(SubcategoryRepository.createSubcategory).mockResolvedValueOnce(created as any);

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining", target: 300 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.createSubcategory(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(SubcategoryRepository.createSubcategory).toHaveBeenCalledWith({
        name: "Dining",
        target: "300",
        categoryId: validCategoryId,
      });
    });

    it("should return 500 when repository fails on create", async () => {
      vi.mocked(CategoryRepository.findCategoryByIdAndUserId).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(SubcategoryRepository.createSubcategory).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({
        params: { id: validCategoryId },
        body: { name: "Dining" },
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
      const req = createMockRequest({ params: { id: validSubcategoryId }, body: { name: "Fast Food" } });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if subcategory not found for user", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "Fast Food" },
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
        body: { name: "" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should set a target on update", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      const updated = { id: validSubcategoryId, name: "Fast Food", target: "250" };
      vi.mocked(SubcategoryRepository.updateSubcategory).mockResolvedValueOnce(updated as any);

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "Fast Food", target: 250 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(SubcategoryRepository.updateSubcategory).toHaveBeenCalledWith(validSubcategoryId, {
        name: "Fast Food",
        target: "250",
      });
    });

    it("should clear the target on update when target is empty", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      const updated = { id: validSubcategoryId, name: "Fast Food", target: null };
      vi.mocked(SubcategoryRepository.updateSubcategory).mockResolvedValueOnce(updated as any);

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "Fast Food", target: "" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.updateSubcategory(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(SubcategoryRepository.updateSubcategory).toHaveBeenCalledWith(validSubcategoryId, {
        name: "Fast Food",
        target: null,
      });
    });

    it("should return 500 when repository fails on update", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      vi.mocked(SubcategoryRepository.updateSubcategory).mockRejectedValueOnce(new Error("Update failed"));

      const req = createMockRequest({
        params: { id: validSubcategoryId },
        body: { name: "Fast Food" },
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

  describe("setAssignment", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validSubcategoryId, month }, body: { assigned: 100 } });
      const res = createMockResponse();

      await SubcategoryHandler.setAssignment(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 for an invalid month", async () => {
      const req = createMockRequest({
        params: { id: validSubcategoryId, month: "2026-13" },
        body: { assigned: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.setAssignment(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("month");
    });

    it("should return 404 if subcategory not found for user", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validSubcategoryId, month },
        body: { assigned: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.setAssignment(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 400 if assigned is negative", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);

      const req = createMockRequest({
        params: { id: validSubcategoryId, month },
        body: { assigned: -5 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.setAssignment(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("assigned");
    });

    it("should save the assignment on success", async () => {
      vi.mocked(SubcategoryRepository.findSubcategoryByIdAndUserId).mockResolvedValueOnce({
        id: validSubcategoryId,
      } as any);
      const saved = { id: "a1", subcategoryId: validSubcategoryId, month, assigned: "2500" };
      vi.mocked(SubcategoryAssignmentRepository.setAssigned).mockResolvedValueOnce(saved as any);

      const req = createMockRequest({
        params: { id: validSubcategoryId, month },
        body: { assigned: 2500 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.setAssignment(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(saved);
      expect(SubcategoryAssignmentRepository.setAssigned).toHaveBeenCalledWith(validSubcategoryId, month, "2500");
    });
  });

  describe("fundTargets", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: { month, subcategoryIds: [] } });
      const res = createMockResponse();

      await SubcategoryHandler.fundTargets(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 for an invalid month", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month: "nope", subcategoryIds: [] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.fundTargets(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if subcategoryIds is not an array", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: "x" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.fundTargets(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [validSubcategoryId] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.fundTargets(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should fund under-funded targets, skip funded, and ignore no-target", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SubcategoryAssignmentRepository.findOwnedWithAssignment).mockResolvedValueOnce([
        { subcategoryId: "under", target: "3000", assigned: "1000" },
        { subcategoryId: "funded", target: "500", assigned: "500" },
        { subcategoryId: "notarget", target: null, assigned: null },
        { subcategoryId: "empty", target: "200", assigned: null },
      ] as any);
      vi.mocked(SubcategoryAssignmentRepository.setAssignedEach).mockResolvedValue([] as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: ["under", "funded", "notarget", "empty"] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.fundTargets(req, res as any);
      expect(res.statusCode).toBe(200);
      // Only the under-funded and the empty (no assignment yet) ones get set to their target.
      expect(SubcategoryAssignmentRepository.setAssignedEach).toHaveBeenCalledWith(
        [
          { subcategoryId: "under", assigned: "3000" },
          { subcategoryId: "empty", assigned: "200" },
        ],
        month,
      );
    });

    it("should return 500 when a repository call fails", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SubcategoryAssignmentRepository.findOwnedWithAssignment).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [validSubcategoryId] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.fundTargets(req, res as any);
      expect(res.statusCode).toBe(500);
    });
  });

  describe("bulkAssign", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [], assigned: 100 },
      });
      const res = createMockResponse();

      await SubcategoryHandler.bulkAssign(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 for an invalid month", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month: "nope", subcategoryIds: [validSubcategoryId], assigned: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.bulkAssign(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if subcategoryIds is not an array", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: "x", assigned: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.bulkAssign(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if assigned is negative", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [validSubcategoryId], assigned: -5 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.bulkAssign(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("assigned");
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [validSubcategoryId], assigned: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.bulkAssign(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should assign the amount to each owned subcategory", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SubcategoryAssignmentRepository.findOwnedWithAssignment).mockResolvedValueOnce([
        { subcategoryId: "a", target: null, assigned: null, spent: "0" },
        { subcategoryId: "b", target: null, assigned: "100", spent: "0" },
      ] as any);
      vi.mocked(SubcategoryAssignmentRepository.setAssignedMany).mockResolvedValueOnce([] as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: ["a", "b"], assigned: 500 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.bulkAssign(req, res as any);
      expect(res.statusCode).toBe(200);
      // Only the owned ids are passed on, with the stringified amount.
      expect(SubcategoryAssignmentRepository.setAssignedMany).toHaveBeenCalledWith(["a", "b"], month, "500");
    });

    it("should return 500 when a repository call fails", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SubcategoryAssignmentRepository.findOwnedWithAssignment).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [validSubcategoryId], assigned: 100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.bulkAssign(req, res as any);
      expect(res.statusCode).toBe(500);
    });
  });

  describe("coverOverspending", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: { month, subcategoryIds: [] } });
      const res = createMockResponse();

      await SubcategoryHandler.coverOverspending(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 for an invalid month", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month: "nope", subcategoryIds: [validSubcategoryId] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.coverOverspending(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if subcategoryIds is not an array", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: 5 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.coverOverspending(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [validSubcategoryId] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.coverOverspending(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should raise only overspent lines to their spent amount", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SubcategoryAssignmentRepository.findOwnedWithAssignment).mockResolvedValueOnce([
        { subcategoryId: "over", target: null, assigned: "500", spent: "1000" }, // overspent by 500
        { subcategoryId: "fine", target: null, assigned: "800", spent: "300" }, // not overspent
        { subcategoryId: "empty", target: null, assigned: null, spent: "250" }, // overspent (no assignment yet)
        { subcategoryId: "exact", target: null, assigned: "400", spent: "400" }, // exactly spent, not over
      ] as any);
      vi.mocked(SubcategoryAssignmentRepository.setAssignedEach).mockResolvedValue([] as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: ["over", "fine", "empty", "exact"] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.coverOverspending(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(SubcategoryAssignmentRepository.setAssignedEach).toHaveBeenCalledWith(
        [
          { subcategoryId: "over", assigned: "1000" },
          { subcategoryId: "empty", assigned: "250" },
        ],
        month,
      );
    });

    it("should return 500 when a repository call fails", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SubcategoryAssignmentRepository.findOwnedWithAssignment).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { month, subcategoryIds: [validSubcategoryId] },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SubcategoryHandler.coverOverspending(req, res as any);
      expect(res.statusCode).toBe(500);
    });
  });
});
