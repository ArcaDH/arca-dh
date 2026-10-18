import { describe, it, expect, vi, beforeEach } from "vitest";
import { MonthlyPaymentHandler } from "../../src/handlers/monthlyPayments";
import { MonthlyPaymentRepository } from "../../src/repositories/monthlyPaymentRepository";
import { MonthlyPaymentService } from "../../src/services/monthlyPaymentService";
import { PlanRepository } from "../../src/repositories/planRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/monthlyPaymentRepository", () => ({
  MonthlyPaymentRepository: {
    findByIdAndUserId: vi.fn(),
    deleteById: vi.fn(),
  },
}));

vi.mock("../../src/services/monthlyPaymentService", () => ({
  MonthlyPaymentService: {
    listWithNextCharge: vi.fn(),
  },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

describe("MonthlyPaymentHandler (monthlyPayments.ts)", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const validPaymentId = "923e4567-e89b-12d3-a456-426614174009";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMonthlyPayments", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId } });
      const res = createMockResponse();

      await MonthlyPaymentHandler.getMonthlyPayments(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if the token has no user id", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        headers: { authorization: `Bearer ${generateTokenWithoutUserId()}` },
      });
      const res = createMockResponse();

      await MonthlyPaymentHandler.getMonthlyPayments(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if the plan id is not a valid UUID", async () => {
      const req = createMockRequest({ params: { planId: "nope" }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.getMonthlyPayments(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Plan not found" });
    });

    it("should return 404 if the plan does not belong to the user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.getMonthlyPayments(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(MonthlyPaymentService.listWithNextCharge).not.toHaveBeenCalled();
    });

    it("should return 200 with the payments and their next charge", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const payments = [{ id: validPaymentId, amount: -8500, dayOfMonth: 25, nextCharge: "2026-11-25", tags: [] }];
      vi.mocked(MonthlyPaymentService.listWithNextCharge).mockResolvedValueOnce(payments as any);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.getMonthlyPayments(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(payments);
      expect(MonthlyPaymentService.listWithNextCharge).toHaveBeenCalledWith(validPlanId);
    });

    it("should return 500 when the service throws", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(MonthlyPaymentService.listWithNextCharge).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.getMonthlyPayments(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("deleteMonthlyPayment", () => {
    it("should return 401 if request is unauthorized", async () => {
      const req = createMockRequest({ params: { id: validPaymentId } });
      const res = createMockResponse();

      await MonthlyPaymentHandler.deleteMonthlyPayment(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if the token has no user id", async () => {
      const req = createMockRequest({
        params: { id: validPaymentId },
        headers: { authorization: `Bearer ${generateTokenWithoutUserId()}` },
      });
      const res = createMockResponse();

      await MonthlyPaymentHandler.deleteMonthlyPayment(req, res as any);
      expect(res.statusCode).toBe(401);
      expect(MonthlyPaymentRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should return 404 if the id is not a valid UUID", async () => {
      const req = createMockRequest({ params: { id: "nope" }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.deleteMonthlyPayment(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Monthly payment not found" });
    });

    it("should return 404 if the payment does not exist or belongs to someone else", async () => {
      vi.mocked(MonthlyPaymentRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validPaymentId }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.deleteMonthlyPayment(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(MonthlyPaymentRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should return 204 and stop the payment", async () => {
      vi.mocked(MonthlyPaymentRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPaymentId } as any);
      vi.mocked(MonthlyPaymentRepository.deleteById).mockResolvedValueOnce(true);

      const req = createMockRequest({ params: { id: validPaymentId }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.deleteMonthlyPayment(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(MonthlyPaymentRepository.findByIdAndUserId).toHaveBeenCalledWith(validPaymentId, userId);
      expect(MonthlyPaymentRepository.deleteById).toHaveBeenCalledWith(validPaymentId);
    });

    it("should return 500 when the repository throws", async () => {
      vi.mocked(MonthlyPaymentRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPaymentId } as any);
      vi.mocked(MonthlyPaymentRepository.deleteById).mockRejectedValueOnce(new Error("Delete error"));

      const req = createMockRequest({ params: { id: validPaymentId }, tokenUserId: userId });
      const res = createMockResponse();

      await MonthlyPaymentHandler.deleteMonthlyPayment(req, res as any);
      expect(res.statusCode).toBe(500);
    });
  });
});
