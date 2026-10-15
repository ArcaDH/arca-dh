import { describe, it, expect, vi, beforeEach } from "vitest";
import { SavingsGoalHandler } from "../../src/handlers/savingsGoals";
import { SavingsGoalRepository } from "../../src/repositories/savingsGoalRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/savingsGoalRepository", () => ({
  SavingsGoalRepository: {
    findByPlanId: vi.fn(),
    createGoal: vi.fn(),
    findByIdAndUserId: vi.fn(),
    getGoalWithProgress: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
  },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

describe("SavingsGoalHandler (savingsGoals.ts)", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const validGoalId = "223e4567-e89b-12d3-a456-426614174001";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGoals", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId } });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoals(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { planId: validPlanId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoals(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if planId is not a valid UUID", async () => {
      const req = createMockRequest({ params: { planId: "not-a-uuid" }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoals(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Plan not found" });
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoals(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Plan not found" });
    });

    it("should return 200 with list of savings goals on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const goals = [{ id: validGoalId, name: "Car", targetAmount: "5000", budgetPlanId: validPlanId }];
      vi.mocked(SavingsGoalRepository.findByPlanId).mockResolvedValueOnce(goals as any);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoals(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(goals);
      expect(SavingsGoalRepository.findByPlanId).toHaveBeenCalledWith(validPlanId);
    });

    it("should return 500 when repository fails on getGoals", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SavingsGoalRepository.findByPlanId).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoals(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("createGoal", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: { name: "Car", targetAmount: 5000 } });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if name is missing or invalid", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "", targetAmount: 5000 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 400 if body is missing or name is not a string", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        tokenUserId: userId,
      });
      (req as any).body = undefined;
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(400);

      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const req2 = createMockRequest({
        params: { planId: validPlanId },
        body: { name: 123, targetAmount: 5000 },
        tokenUserId: userId,
      });
      const res2 = createMockResponse();
      await SavingsGoalHandler.createGoal(req2, res2 as any);
      expect(res2.statusCode).toBe(400);
    });

    it("should return 400 if targetAmount is non-positive or NaN", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Car", targetAmount: -10 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("targetAmount");

      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const req2 = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Car", targetAmount: "not-a-number" },
        tokenUserId: userId,
      });
      const res2 = createMockResponse();
      await SavingsGoalHandler.createGoal(req2, res2 as any);
      expect(res2.statusCode).toBe(400);
    });

    it("should return 400 if deadline is not a string", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Car", targetAmount: 5000, deadline: 12345 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if deadline format is invalid", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Car", targetAmount: 5000, deadline: "invalid-date" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("YYYY-MM-DD");
    });

    it("should return 400 if deadline is a past date", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Car", targetAmount: 5000, deadline: "2020-01-01" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("future");
    });

    it("should return 201 with created goal on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const createdGoal = {
        id: validGoalId,
        name: "Car",
        targetAmount: "5000",
        deadline: "2028-12-31",
        budgetPlanId: validPlanId,
      };
      vi.mocked(SavingsGoalRepository.createGoal).mockResolvedValueOnce(createdGoal as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Car", targetAmount: 5000, deadline: "2028-12-31" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(createdGoal);
      expect(SavingsGoalRepository.createGoal).toHaveBeenCalledWith({
        name: "Car",
        targetAmount: "5000",
        deadline: "2028-12-31",
        monthlyAmount: null,
        budgetPlanId: validPlanId,
      });
    });

    it("should create an open-ended goal with a monthly amount", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SavingsGoalRepository.createGoal).mockResolvedValueOnce({ id: validGoalId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Buffer", targetAmount: 3000, monthlyAmount: 250 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(SavingsGoalRepository.createGoal).toHaveBeenCalledWith({
        name: "Buffer",
        targetAmount: "3000",
        deadline: null,
        monthlyAmount: "250",
        budgetPlanId: validPlanId,
      });
    });

    it("should return 400 if monthlyAmount is non-positive or NaN", async () => {
      for (const monthlyAmount of [0, -50, "abc"]) {
        vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
        const req = createMockRequest({
          params: { planId: validPlanId },
          body: { name: "Buffer", targetAmount: 3000, monthlyAmount },
          tokenUserId: userId,
        });
        const res = createMockResponse();

        await SavingsGoalHandler.createGoal(req, res as any);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("monthlyAmount");
      }
      expect(SavingsGoalRepository.createGoal).not.toHaveBeenCalled();
    });

    it("should return 500 when repository fails on create", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SavingsGoalRepository.createGoal).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Car", targetAmount: 5000 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.createGoal(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("getGoalById", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validGoalId } });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoalById(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validGoalId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoalById(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if goal not found for user", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validGoalId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoalById(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Savings goal not found" });
    });

    it("should return 200 with goal and progress on success", async () => {
      const mockGoal = { id: validGoalId, name: "Car", targetAmount: "5000" };
      const goalWithProgress = { ...mockGoal, currentAmount: 1000, progressPercentage: 20 };
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce(mockGoal as any);
      vi.mocked(SavingsGoalRepository.getGoalWithProgress).mockResolvedValueOnce(goalWithProgress as any);

      const req = createMockRequest({ params: { id: validGoalId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoalById(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(goalWithProgress);
      expect(SavingsGoalRepository.getGoalWithProgress).toHaveBeenCalledWith(mockGoal);
    });

    it("should return 500 when repository fails on getGoalById", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { id: validGoalId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.getGoalById(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("updateGoal", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validGoalId }, body: { name: "Vacation", targetAmount: 2000 } });
      const res = createMockResponse();

      await SavingsGoalHandler.updateGoal(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validGoalId },
        headers: { authorization: `Bearer ${token}` },
        body: { name: "Vacation", targetAmount: 2000 },
      });
      const res = createMockResponse();

      await SavingsGoalHandler.updateGoal(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if goal not found for user", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validGoalId },
        body: { name: "Vacation", targetAmount: 2000 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.updateGoal(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Savings goal not found" });
    });

    it("should return 400 if validation fails on update", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validGoalId } as any);

      const req = createMockRequest({
        params: { id: validGoalId },
        body: { name: "", targetAmount: 2000 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.updateGoal(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 200 with updated goal on success", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validGoalId } as any);
      const updatedGoal = { id: validGoalId, name: "Vacation", targetAmount: "2500", deadline: "2028-06-01" };
      vi.mocked(SavingsGoalRepository.updateGoal).mockResolvedValueOnce(updatedGoal as any);

      const req = createMockRequest({
        params: { id: validGoalId },
        body: { name: "Vacation", targetAmount: 2500, deadline: "2028-06-01" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.updateGoal(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updatedGoal);
      expect(SavingsGoalRepository.updateGoal).toHaveBeenCalledWith(validGoalId, {
        name: "Vacation",
        targetAmount: "2500",
        deadline: "2028-06-01",
        monthlyAmount: null,
      });
    });

    it("should return 500 when repository fails on update", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validGoalId } as any);
      vi.mocked(SavingsGoalRepository.updateGoal).mockRejectedValueOnce(new Error("Update failed"));

      const req = createMockRequest({
        params: { id: validGoalId },
        body: { name: "Vacation", targetAmount: 2500 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await SavingsGoalHandler.updateGoal(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("deleteGoal", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validGoalId } });
      const res = createMockResponse();

      await SavingsGoalHandler.deleteGoal(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validGoalId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await SavingsGoalHandler.deleteGoal(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if goal not found for user", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validGoalId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.deleteGoal(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Savings goal not found" });
    });

    it("should return 204 on successful delete", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validGoalId } as any);
      vi.mocked(SavingsGoalRepository.deleteGoal).mockResolvedValueOnce(true);

      const req = createMockRequest({ params: { id: validGoalId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.deleteGoal(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(SavingsGoalRepository.deleteGoal).toHaveBeenCalledWith(validGoalId);
    });

    it("should return 500 when repository fails on delete", async () => {
      vi.mocked(SavingsGoalRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validGoalId } as any);
      vi.mocked(SavingsGoalRepository.deleteGoal).mockRejectedValueOnce(new Error("Delete failed"));

      const req = createMockRequest({ params: { id: validGoalId }, tokenUserId: userId });
      const res = createMockResponse();

      await SavingsGoalHandler.deleteGoal(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });
});
