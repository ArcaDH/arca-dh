import { describe, it, expect, vi, beforeEach } from "vitest";
import { OverviewHandler } from "../../src/handlers/overview";
import { OverviewRepository } from "../../src/repositories/overviewRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
import { createMockRequest, createMockResponse, generateTokenWithoutUserId } from "./helpers";

vi.mock("../../src/repositories/overviewRepository", () => ({
  OverviewRepository: {
    getMonthlyOverview: vi.fn(),
  },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

vi.mock("../../src/services/monthlyPaymentService", () => ({
  MonthlyPaymentService: {
    ensureGenerated: vi.fn(),
    listWithNextCharge: vi.fn(),
  },
}));

describe("OverviewHandler (overview.ts)", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    const req = createMockRequest({ params: { planId: validPlanId }, query: { month: "2026-10" } });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(401);
  });

  it("should return 401 if token has no userId", async () => {
    const token = generateTokenWithoutUserId();
    const req = createMockRequest({
      params: { planId: validPlanId },
      query: { month: "2026-10" },
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(401);
  });

  it("should return 404 if planId is not a valid UUID", async () => {
    const req = createMockRequest({
      params: { planId: "not-a-uuid" },
      query: { month: "2026-10" },
      tokenUserId: userId,
    });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(404);
  });

  it("should return 404 if plan is not found for the user", async () => {
    vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

    const req = createMockRequest({
      params: { planId: validPlanId },
      query: { month: "2026-10" },
      tokenUserId: userId,
    });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ code: 404, message: "Plan not found" });
  });

  it("should return 400 if month query parameter is missing", async () => {
    vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

    const req = createMockRequest({
      params: { planId: validPlanId },
      query: {},
      tokenUserId: userId,
    });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("month");
  });

  it("should return 400 if month query parameter is not in YYYY-MM format", async () => {
    vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

    const req = createMockRequest({
      params: { planId: validPlanId },
      query: { month: "2026-13" },
      tokenUserId: userId,
    });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(400);
  });

  it("should return 200 with monthly overview on success", async () => {
    vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
    const mockOverview = {
      month: "2026-10",
      totalIncome: 5000,
      totalExpenses: 2000,
      totalSavings: 500,
      categories: [],
    };
    vi.mocked(OverviewRepository.getMonthlyOverview).mockResolvedValueOnce(mockOverview as any);

    const req = createMockRequest({
      params: { planId: validPlanId },
      query: { month: "2026-10" },
      tokenUserId: userId,
    });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockOverview);
    expect(OverviewRepository.getMonthlyOverview).toHaveBeenCalledWith(validPlanId, "2026-10");
  });

  it("should return 500 when repository throws an error", async () => {
    vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
    vi.mocked(OverviewRepository.getMonthlyOverview).mockRejectedValueOnce(new Error("Query failed"));

    const req = createMockRequest({
      params: { planId: validPlanId },
      query: { month: "2026-10" },
      tokenUserId: userId,
    });
    const res = createMockResponse();

    await OverviewHandler.getOverview(req, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ code: 500, message: "Internal server error" });
  });
});
