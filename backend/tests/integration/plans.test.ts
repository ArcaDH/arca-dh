import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlanHandler } from "../../src/handlers/plans";
import { PlanRepository } from "../../src/repositories/planRepository";
import { UserRepository } from "../../src/repositories/userRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByUserId: vi.fn(),
    createPlan: vi.fn(),
    findByIdAndUserId: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
  },
}));

vi.mock("../../src/repositories/userRepository", () => ({
  UserRepository: {
    findById: vi.fn(),
    updateCurrentPlanId: vi.fn(),
  },
}));

describe("PlanHandler (plans.ts)", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlans", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await PlanHandler.getPlans(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({ headers: { authorization: `Bearer ${token}` } });
      const res = createMockResponse();

      await PlanHandler.getPlans(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if month query parameter format is invalid", async () => {
      const req = createMockRequest({ query: { month: "2026-99" }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlans(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("month");
    });

    it("should return 404 if user not found", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlans(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 200 with list of plans on success", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId: userId,
        currentPlanId: validPlanId,
      } as any);

      const plans = [
        { id: validPlanId, name: "Plan A", month: "2026-10" },
        { id: "223e4567-e89b-12d3-a456-426614174001", name: "Plan B", month: "2026-11" },
      ];
      vi.mocked(PlanRepository.findByUserId).mockResolvedValueOnce(plans as any);

      const req = createMockRequest({ query: { month: "2026-10" }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlans(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([
        { id: validPlanId, name: "Plan A", month: "2026-10", current: true },
        { id: "223e4567-e89b-12d3-a456-426614174001", name: "Plan B", month: "2026-11", current: false },
      ]);
      expect(PlanRepository.findByUserId).toHaveBeenCalledWith(userId, "2026-10");
    });

    it("should return 200 with list of plans when no month query is provided", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId: userId,
        currentPlanId: validPlanId,
      } as any);

      vi.mocked(PlanRepository.findByUserId).mockResolvedValueOnce([
        { id: validPlanId, name: "Plan A", month: "2026-10" },
      ] as any);

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlans(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(PlanRepository.findByUserId).toHaveBeenCalledWith(userId, undefined);
    });

    it("should return 500 when repository fails on getPlans", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlans(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("createPlan", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ body: { name: "New Plan" } });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
        body: { name: "New Plan" },
      });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if name is missing or empty", async () => {
      const req = createMockRequest({ body: { name: "  " }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 400 if month format is invalid", async () => {
      const req = createMockRequest({ body: { name: "Plan", month: "invalid-month" }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("YYYY-MM");
    });

    it("should return 400 if month is in the past", async () => {
      const req = createMockRequest({ body: { name: "Plan", month: "2000-01" }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("past");
    });

    it("should return 404 if user not found", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(null);

      const futureMonth = "2028-05";
      const req = createMockRequest({ body: { name: "Plan", month: futureMonth }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 201 and set as current when user has no current plan", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId: userId,
        currentPlanId: null,
      } as any);

      const futureMonth = "2028-05";
      const createdPlan = { id: validPlanId, name: "Plan A", month: futureMonth };
      vi.mocked(PlanRepository.createPlan).mockResolvedValueOnce(createdPlan as any);
      vi.mocked(UserRepository.updateCurrentPlanId).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({
        body: { name: "Plan A", month: futureMonth },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: validPlanId, name: "Plan A", month: futureMonth, current: true });
      expect(UserRepository.updateCurrentPlanId).toHaveBeenCalledWith(userId, validPlanId);
    });

    it("should return 201 with default month when month is omitted", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId: userId,
        currentPlanId: "other-plan-id",
      } as any);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const createdPlan = { id: validPlanId, name: "Default Month Plan", month: currentMonth };
      vi.mocked(PlanRepository.createPlan).mockResolvedValueOnce(createdPlan as any);

      const req = createMockRequest({
        body: { name: "Default Month Plan" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body.current).toBe(false);
      expect(res.body.month).toBe(currentMonth);
    });

    it("should return 500 when repository fails on createPlan", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({
        body: { name: "Fail Plan" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.createPlan(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("getCurrentPlan", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await PlanHandler.getCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({ headers: { authorization: `Bearer ${token}` } });
      const res = createMockResponse();

      await PlanHandler.getCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if user not found or has no currentPlanId", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId, currentPlanId: null } as any);

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("No current plan selected yet");
    });

    it("should return 404 if current plan is not found in plan repository", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId,
        currentPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("No current plan selected yet");
    });

    it("should return 200 with current plan on success", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId,
        currentPlanId: validPlanId,
      } as any);
      const plan = { id: validPlanId, name: "Current Plan", month: "2026-10" };
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(plan as any);

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: validPlanId, name: "Current Plan", month: "2026-10", current: true });
    });

    it("should return 500 when repository fails on getCurrentPlan", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("setCurrentPlan", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ body: { planId: validPlanId } });
      const res = createMockResponse();

      await PlanHandler.setCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
        body: { planId: validPlanId },
      });
      const res = createMockResponse();

      await PlanHandler.setCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if planId is not a valid UUID", async () => {
      const req = createMockRequest({ body: { planId: "invalid-uuid" }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.setCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Plan not found");
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ body: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.setCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Plan not found");
    });

    it("should return 200 on success", async () => {
      const plan = { id: validPlanId, name: "New Default Plan", month: "2026-10" };
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(plan as any);
      vi.mocked(UserRepository.updateCurrentPlanId).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({ body: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.setCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: validPlanId, name: "New Default Plan", month: "2026-10", current: true });
      expect(UserRepository.updateCurrentPlanId).toHaveBeenCalledWith(userId, validPlanId);
    });

    it("should return 500 when repository fails on setCurrentPlan", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ body: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.setCurrentPlan(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("getPlanById", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId } });
      const res = createMockResponse();

      await PlanHandler.getPlanById(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { planId: validPlanId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await PlanHandler.getPlanById(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if planId is not a valid UUID", async () => {
      const req = createMockRequest({ params: { planId: "not-a-uuid" }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlanById(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if user not found", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlanById(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId, currentPlanId: null } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlanById(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Plan not found");
    });

    it("should return 200 with plan on success", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId,
        currentPlanId: validPlanId,
      } as any);
      const plan = { id: validPlanId, name: "Plan A", month: "2026-10" };
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(plan as any);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlanById(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: validPlanId, name: "Plan A", month: "2026-10", current: true });
    });

    it("should return 500 when repository fails on getPlanById", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.getPlanById(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("updatePlan", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: { name: "Updated" } });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { planId: validPlanId },
        headers: { authorization: `Bearer ${token}` },
        body: { name: "Updated" },
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if planId is not a valid UUID", async () => {
      const req = createMockRequest({
        params: { planId: "not-uuid" },
        body: { name: "Updated" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 400 if name is missing or empty", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "   " },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("name");
    });

    it("should return 404 if user not found", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Updated" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Updated" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Plan not found");
    });

    it("should return 400 if updated month format is invalid", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId, month: "2026-10" } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Updated", month: "bad-month" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if updated month is in the past", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId, month: "2026-10" } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Updated", month: "2010-01" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 200 with updated plan on success (updating month)", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId,
        currentPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({
        id: validPlanId,
        name: "Old Name",
        month: "2026-10",
      } as any);
      vi.mocked(PlanRepository.updatePlan).mockResolvedValueOnce(undefined as any);

      const futureMonth = "2028-11";
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "New Name", month: futureMonth },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        id: validPlanId,
        name: "New Name",
        month: futureMonth,
        current: true,
      });
      expect(PlanRepository.updatePlan).toHaveBeenCalledWith(validPlanId, {
        name: "New Name",
        month: futureMonth,
      });
    });

    it("should return 200 keeping existing month when month is omitted in update", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId,
        currentPlanId: null,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({
        id: validPlanId,
        name: "Old Name",
        month: "2026-10",
      } as any);
      vi.mocked(PlanRepository.updatePlan).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Renamed" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body.month).toBe("2026-10");
    });

    it("should return 500 when repository fails on updatePlan", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { name: "Renamed" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await PlanHandler.updatePlan(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("deletePlan", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId } });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if token has no userId", async () => {
      const token = generateTokenWithoutUserId();
      const req = createMockRequest({
        params: { planId: validPlanId },
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if planId is not a valid UUID", async () => {
      const req = createMockRequest({ params: { planId: "bad-id" }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if user not found", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if plan not found for user", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({ userId } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Plan not found");
    });

    it("should return 204 and reset currentPlanId if deleted plan was current", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId,
        currentPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(UserRepository.updateCurrentPlanId).mockResolvedValueOnce(undefined as any);
      vi.mocked(PlanRepository.deletePlan).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(UserRepository.updateCurrentPlanId).toHaveBeenCalledWith(userId, null);
      expect(PlanRepository.deletePlan).toHaveBeenCalledWith(validPlanId);
    });

    it("should return 204 without resetting currentPlanId if deleted plan was not current", async () => {
      vi.mocked(UserRepository.findById).mockResolvedValueOnce({
        userId,
        currentPlanId: "other-current-plan",
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(PlanRepository.deletePlan).mockResolvedValueOnce(undefined as any);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(UserRepository.updateCurrentPlanId).not.toHaveBeenCalled();
      expect(PlanRepository.deletePlan).toHaveBeenCalledWith(validPlanId);
    });

    it("should return 500 when repository fails on deletePlan", async () => {
      vi.mocked(UserRepository.findById).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await PlanHandler.deletePlan(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });
});
