import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MonthlyPaymentService } from "../../src/services/monthlyPaymentService";
import { MonthlyPaymentRepository } from "../../src/repositories/monthlyPaymentRepository";

vi.mock("../../src/repositories/monthlyPaymentRepository", () => ({
  MonthlyPaymentRepository: {
    findByPlanId: vi.fn(),
    createDueTransactions: vi.fn(),
  },
}));

describe("MonthlyPaymentService (monthlyPaymentService.ts)", () => {
  const planId = "123e4567-e89b-12d3-a456-426614174000";
  const now = new Date("2026-10-14T12:00:00Z");

  const payment = (overrides: Record<string, unknown> = {}) => ({
    id: "923e4567-e89b-12d3-a456-426614174009",
    budgetPlanId: planId,
    amount: -8500,
    description: "Rent",
    dayOfMonth: 5,
    generatedThrough: "2026-10",
    categoryId: "323e4567-e89b-12d3-a456-426614174002",
    tags: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ensureGenerated", () => {
    it("should do nothing when the plan has no monthly payments", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([]);

      await MonthlyPaymentService.ensureGenerated(planId, now);
      expect(MonthlyPaymentRepository.findByPlanId).toHaveBeenCalledWith(planId);
      expect(MonthlyPaymentRepository.createDueTransactions).not.toHaveBeenCalled();
    });

    it("should do nothing when everything up to this month is already handled", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([payment()] as any);

      await MonthlyPaymentService.ensureGenerated(planId, now);
      expect(MonthlyPaymentRepository.createDueTransactions).not.toHaveBeenCalled();
    });

    it("should create this month's transaction once its due date has been reached", async () => {
      const due = payment({ generatedThrough: "2026-09", dayOfMonth: 5 });
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([due] as any);

      await MonthlyPaymentService.ensureGenerated(planId, now);
      expect(MonthlyPaymentRepository.createDueTransactions).toHaveBeenCalledWith(due, [
        { month: "2026-10", date: "2026-10-05" },
      ]);
    });

    it("should not create this month's transaction before its due date", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([
        payment({ generatedThrough: "2026-09", dayOfMonth: 25 }),
      ] as any);

      await MonthlyPaymentService.ensureGenerated(planId, now);
      expect(MonthlyPaymentRepository.createDueTransactions).not.toHaveBeenCalled();
    });

    it("should create every missed month, each on its own due date", async () => {
      const due = payment({ generatedThrough: "2026-06", dayOfMonth: 31 });
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([due] as any);

      await MonthlyPaymentService.ensureGenerated(planId, now);
      // Day 31 becomes the 30th in September, and October's 31st has not come yet
      expect(MonthlyPaymentRepository.createDueTransactions).toHaveBeenCalledWith(due, [
        { month: "2026-07", date: "2026-07-31" },
        { month: "2026-08", date: "2026-08-31" },
        { month: "2026-09", date: "2026-09-30" },
      ]);
    });

    it("should handle each payment of the plan separately", async () => {
      const rent = payment({ id: "rent", generatedThrough: "2026-09", dayOfMonth: 1 });
      const gym = payment({ id: "gym", generatedThrough: "2026-10", dayOfMonth: 1 });
      const phone = payment({ id: "phone", generatedThrough: "2026-08", dayOfMonth: 10 });
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([rent, gym, phone] as any);

      await MonthlyPaymentService.ensureGenerated(planId, now);
      expect(MonthlyPaymentRepository.createDueTransactions).toHaveBeenCalledTimes(2);
      expect(MonthlyPaymentRepository.createDueTransactions).toHaveBeenCalledWith(rent, [
        { month: "2026-10", date: "2026-10-01" },
      ]);
      expect(MonthlyPaymentRepository.createDueTransactions).toHaveBeenCalledWith(phone, [
        { month: "2026-09", date: "2026-09-10" },
        { month: "2026-10", date: "2026-10-10" },
      ]);
    });

    it("should create a payment due on the 1st at midnight Swedish time, not an hour or two later", async () => {
      const due = payment({ generatedThrough: "2026-10", dayOfMonth: 1 });
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([due] as any);

      // 00:30 on 1 November in Sweden, but still 31 October in UTC
      await MonthlyPaymentService.ensureGenerated(planId, new Date("2026-10-31T23:30:00Z"));
      expect(MonthlyPaymentRepository.createDueTransactions).toHaveBeenCalledWith(due, [
        { month: "2026-11", date: "2026-11-01" },
      ]);
    });

    it("should use the date of the clock it is given in Swedish time", async () => {
      const due = payment({ generatedThrough: "2026-10", dayOfMonth: 31 });
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([due] as any);

      await MonthlyPaymentService.ensureGenerated(planId, new Date("2026-11-30T23:30:00Z"));
      expect(MonthlyPaymentRepository.createDueTransactions).toHaveBeenCalledWith(due, [
        { month: "2026-11", date: "2026-11-30" },
      ]);
    });

    it("should log and not throw when the database fails", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockRejectedValueOnce(new Error("DB error"));

      await expect(MonthlyPaymentService.ensureGenerated(planId, now)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });

    it("should log and not throw when creating the transactions fails", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([
        payment({ generatedThrough: "2026-09" }),
      ] as any);
      vi.mocked(MonthlyPaymentRepository.createDueTransactions).mockRejectedValueOnce(new Error("Insert error"));

      await expect(MonthlyPaymentService.ensureGenerated(planId, now)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("listWithNextCharge", () => {
    it("should add the next due date and leave out the internal fields", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([
        payment({ generatedThrough: "2026-10", dayOfMonth: 25 }),
      ] as any);

      const result = await MonthlyPaymentService.listWithNextCharge(planId, now);
      expect(result).toHaveLength(1);
      expect(result[0].nextCharge).toBe("2026-11-25");
      expect(result[0]).not.toHaveProperty("generatedThrough");
      expect(result[0]).not.toHaveProperty("budgetPlanId");
      expect(result[0]).toMatchObject({ amount: -8500, description: "Rent", dayOfMonth: 25 });
    });

    it("should give this month's date when it is not handled yet and still ahead", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([
        payment({ generatedThrough: "2026-09", dayOfMonth: 25 }),
      ] as any);

      const result = await MonthlyPaymentService.listWithNextCharge(planId, now);
      expect(result[0].nextCharge).toBe("2026-10-25");
    });

    it("should give an empty list when there are no payments", async () => {
      vi.mocked(MonthlyPaymentRepository.findByPlanId).mockResolvedValueOnce([]);

      expect(await MonthlyPaymentService.listWithNextCharge(planId, now)).toEqual([]);
    });
  });
});
