import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomeSourceHandler } from "../../src/handlers/incomeSources";
import { IncomeSourceRepository } from "../../src/repositories/incomeSourceRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/incomeSourceRepository", () => ({
  IncomeSourceRepository: {
    findByPlanId: vi.fn(),
    createIncomeSource: vi.fn(),
    findByIdAndUserId: vi.fn(),
    updateIncomeSource: vi.fn(),
    deleteIncomeSource: vi.fn(),
  },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

describe("IncomeSourceHandler (incomeSources.ts)", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const validIncomeId = "223e4567-e89b-12d3-a456-426614174001";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getIncomeSources", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId } });
      const res = createMockResponse();

      await IncomeSourceHandler.getIncomeSources(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if plan is not found or not owned by user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await IncomeSourceHandler.getIncomeSources(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Plan not found" });
    });

    it("should return 200 with list of income sources on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const sources = [{ id: validIncomeId, name: "Salary", monthlyAmount: "3000.00", budgetPlanId: validPlanId }];
      vi.mocked(IncomeSourceRepository.findByPlanId).mockResolvedValueOnce(sources as any);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await IncomeSourceHandler.getIncomeSources(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(sources);
      expect(IncomeSourceRepository.findByPlanId).toHaveBeenCalledWith(validPlanId);
    });

    it("should return 500 when repository fails", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(IncomeSourceRepository.findByPlanId).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await IncomeSourceHandler.getIncomeSources(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("createIncomeSource", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Salary", monthlyAmount: 3000 },
      });
      const res = createMockResponse();

      await IncomeSourceHandler.createIncomeSource(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if validation fails (e.g. invalid name)", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "", monthlyAmount: 3000 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.createIncomeSource(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 400 if monthlyAmount is zero or negative", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Salary", monthlyAmount: -100 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.createIncomeSource(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("monthlyAmount");
    });

    it("should return 201 with created income source on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const created = { id: validIncomeId, name: "Salary", monthlyAmount: "3000.00", budgetPlanId: validPlanId };
      vi.mocked(IncomeSourceRepository.createIncomeSource).mockResolvedValueOnce(created as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Salary", monthlyAmount: 3000 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.createIncomeSource(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(created);
      expect(IncomeSourceRepository.createIncomeSource).toHaveBeenCalledWith({
        name: "Salary",
        monthlyAmount: "3000.00",
        budgetPlanId: validPlanId,
      });
    });

    it("should return 500 when repository fails on create", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(IncomeSourceRepository.createIncomeSource).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Salary", monthlyAmount: 3000 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.createIncomeSource(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("updateIncomeSource", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validIncomeId }, body: { name: "Bonus", monthlyAmount: 500 } });
      const res = createMockResponse();

      await IncomeSourceHandler.updateIncomeSource(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validIncomeId },
        headers: { authorization: `Bearer ${token}` },
        body: { name: "Bonus", monthlyAmount: 500 },
      });
      const res = createMockResponse();

      await IncomeSourceHandler.updateIncomeSource(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if income source not found for user", async () => {
      vi.mocked(IncomeSourceRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validIncomeId },
        body: { name: "Bonus", monthlyAmount: 500 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.updateIncomeSource(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Income source not found" });
    });

    it("should return 400 if validation fails during update", async () => {
      vi.mocked(IncomeSourceRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validIncomeId } as any);

      const req = createMockRequest({
        params: { id: validIncomeId },
        body: { name: "", monthlyAmount: 500 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.updateIncomeSource(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 200 with updated income source on success", async () => {
      vi.mocked(IncomeSourceRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validIncomeId } as any);
      const updated = { id: validIncomeId, name: "Bonus", monthlyAmount: "500.00" };
      vi.mocked(IncomeSourceRepository.updateIncomeSource).mockResolvedValueOnce(updated as any);

      const req = createMockRequest({
        params: { id: validIncomeId },
        body: { name: "Bonus", monthlyAmount: 500 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.updateIncomeSource(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updated);
      expect(IncomeSourceRepository.updateIncomeSource).toHaveBeenCalledWith(validIncomeId, {
        name: "Bonus",
        monthlyAmount: "500.00",
      });
    });

    it("should return 500 when repository fails on update", async () => {
      vi.mocked(IncomeSourceRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validIncomeId } as any);
      vi.mocked(IncomeSourceRepository.updateIncomeSource).mockRejectedValueOnce(new Error("Update error"));

      const req = createMockRequest({
        params: { id: validIncomeId },
        body: { name: "Bonus", monthlyAmount: 500 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await IncomeSourceHandler.updateIncomeSource(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("deleteIncomeSource", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validIncomeId } });
      const res = createMockResponse();

      await IncomeSourceHandler.deleteIncomeSource(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { id: validIncomeId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await IncomeSourceHandler.deleteIncomeSource(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if income source not found for user", async () => {
      vi.mocked(IncomeSourceRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validIncomeId }, tokenUserId: userId });
      const res = createMockResponse();

      await IncomeSourceHandler.deleteIncomeSource(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Income source not found" });
    });

    it("should return 204 on successful delete", async () => {
      vi.mocked(IncomeSourceRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validIncomeId } as any);
      vi.mocked(IncomeSourceRepository.deleteIncomeSource).mockResolvedValueOnce(true);

      const req = createMockRequest({ params: { id: validIncomeId }, tokenUserId: userId });
      const res = createMockResponse();

      await IncomeSourceHandler.deleteIncomeSource(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(IncomeSourceRepository.deleteIncomeSource).toHaveBeenCalledWith(validIncomeId);
    });

    it("should return 500 when repository fails on delete", async () => {
      vi.mocked(IncomeSourceRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validIncomeId } as any);
      vi.mocked(IncomeSourceRepository.deleteIncomeSource).mockRejectedValueOnce(new Error("Delete error"));

      const req = createMockRequest({ params: { id: validIncomeId }, tokenUserId: userId });
      const res = createMockResponse();

      await IncomeSourceHandler.deleteIncomeSource(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });
});
