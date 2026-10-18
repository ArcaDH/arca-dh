import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TransactionHandler } from "../../src/handlers/transactions";
import { OverviewHandler } from "../../src/handlers/overview";
import { TransactionRepository } from "../../src/repositories/transactionRepository";
import { OverviewRepository } from "../../src/repositories/overviewRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
import { CategoryRepository } from "../../src/repositories/categoryRepository";
import { SubcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { SavingsGoalRepository } from "../../src/repositories/savingsGoalRepository";
import { TagRepository } from "../../src/repositories/tagRepository";
import { MonthlyPaymentRepository } from "../../src/repositories/monthlyPaymentRepository";
import { MonthlyPaymentService } from "../../src/services/monthlyPaymentService";
import { createMockRequest, createMockResponse } from "./helpers";

vi.mock("../../src/repositories/transactionRepository", () => ({
  TransactionRepository: {
    findByPlanId: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    findById: vi.fn(),
    findFormattedById: vi.fn(),
  },
}));

vi.mock("../../src/repositories/overviewRepository", () => ({
  OverviewRepository: { getMonthlyOverview: vi.fn() },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: { findByIdAndUserId: vi.fn() },
}));

vi.mock("../../src/repositories/categoryRepository", () => ({
  CategoryRepository: { findCategoryById: vi.fn() },
}));

vi.mock("../../src/repositories/subcategoryRepository", () => ({
  SubcategoryRepository: { isSubcategoryOfCategory: vi.fn() },
}));

vi.mock("../../src/repositories/savingsGoalRepository", () => ({
  SavingsGoalRepository: { findById: vi.fn() },
}));

vi.mock("../../src/repositories/tagRepository", () => ({
  TagRepository: { countByIdsAndUserId: vi.fn() },
}));

vi.mock("../../src/repositories/monthlyPaymentRepository", () => ({
  MonthlyPaymentRepository: {
    createWithTransaction: vi.fn(),
    deleteById: vi.fn(),
  },
}));

vi.mock("../../src/services/monthlyPaymentService", () => ({
  MonthlyPaymentService: { ensureGenerated: vi.fn() },
}));

describe("Monthly payments in the transaction and overview handlers", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const validTxId = "223e4567-e89b-12d3-a456-426614174001";
  const validCategoryId = "323e4567-e89b-12d3-a456-426614174002";
  const validSubcategoryId = "423e4567-e89b-12d3-a456-426614174003";
  const tagA = "623e4567-e89b-12d3-a456-426614174005";
  const paymentId = "923e4567-e89b-12d3-a456-426614174009";
  const userId = 1;

  const rentBody = (extra: Record<string, unknown> = {}) => ({
    amount: -8500,
    date: "2026-10-05",
    description: "Rent",
    type: "EXPENSE",
    categoryId: validCategoryId,
    repeatMonthly: { dayOfMonth: 25 },
    ...extra,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-14T12:00:00Z"));
    vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValue({ id: validPlanId } as any);
    vi.mocked(CategoryRepository.findCategoryById).mockResolvedValue({ id: validCategoryId } as any);
    vi.mocked(SubcategoryRepository.isSubcategoryOfCategory).mockResolvedValue(true);
    vi.mocked(SavingsGoalRepository.findById).mockResolvedValue({ id: "goal" } as any);
    vi.mocked(MonthlyPaymentRepository.createWithTransaction).mockResolvedValue(validTxId);
    vi.mocked(TransactionRepository.findFormattedById).mockResolvedValue({
      id: validTxId,
      monthlyPaymentId: paymentId,
    } as any);
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      id: validTxId,
      budgetPlanId: validPlanId,
      monthlyPaymentId: paymentId,
    } as any);
    vi.mocked(TransactionRepository.findByPlanId).mockResolvedValue([] as any);
    vi.mocked(TransactionRepository.updateTransaction).mockResolvedValue({ id: validTxId } as any);
    vi.mocked(TransactionRepository.createTransaction).mockResolvedValue({ id: validTxId } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createTransaction with repeatMonthly", () => {
    it("should create the payment and the transaction together and return the transaction", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: rentBody(), tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: validTxId, monthlyPaymentId: paymentId });
      expect(TransactionRepository.createTransaction).not.toHaveBeenCalled();
      expect(MonthlyPaymentRepository.createWithTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          budgetPlanId: validPlanId,
          amount: "-8500.00",
          description: "Rent",
          dayOfMonth: 25,
          categoryId: validCategoryId,
          subcategoryId: null,
        }),
        expect.objectContaining({ budgetPlanId: validPlanId, date: "2026-10-05", type: "EXPENSE" }),
        [],
        "2026-10",
      );
    });

    it("should not backfill old months, and leave this month's payment to come when its day is ahead", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: rentBody({ date: "2026-06-20" }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      const [payment, , , period] = vi.mocked(MonthlyPaymentRepository.createWithTransaction).mock.calls[0];
      // The 25th of October has not come yet on 14 October, so October is still to be created
      expect(payment.generatedThrough).toBe("2026-09");
      expect(period).toBe("2026-06");
    });

    it("should treat this month as handled when an old transaction is logged after its day", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: rentBody({ date: "2026-06-20", repeatMonthly: { dayOfMonth: 5 } }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      const [payment] = vi.mocked(MonthlyPaymentRepository.createWithTransaction).mock.calls[0];
      expect(payment.generatedThrough).toBe("2026-10");
    });

    it("should still create this month's payment when September's is logged before its day in October", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: rentBody({ date: "2026-09-25" }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      const [payment, , , period] = vi.mocked(MonthlyPaymentRepository.createWithTransaction).mock.calls[0];
      expect(payment.generatedThrough).toBe("2026-09");
      expect(period).toBe("2026-09");
    });

    it("should handle up to a future month when the logged transaction is dated then", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: rentBody({ date: "2026-12-01" }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      const [payment, , , period] = vi.mocked(MonthlyPaymentRepository.createWithTransaction).mock.calls[0];
      expect(payment.generatedThrough).toBe("2026-12");
      expect(period).toBe("2026-12");
    });

    it("should pass the tags on, to be copied to every month", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(1);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: rentBody({ tagIds: [tagA], subcategoryId: validSubcategoryId }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      const [payment, , tagIds] = vi.mocked(MonthlyPaymentRepository.createWithTransaction).mock.calls[0];
      expect(tagIds).toEqual([tagA]);
      expect(payment.subcategoryId).toBe(validSubcategoryId);
    });

    it("should not save the repeat setting as a column of the transaction", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: rentBody(), tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      const [, transaction] = vi.mocked(MonthlyPaymentRepository.createWithTransaction).mock.calls[0];
      expect(transaction).not.toHaveProperty("repeatMonthly");
      expect(transaction).not.toHaveProperty("tagIds");
    });

    it("should accept day 1 and day 31", async () => {
      for (const dayOfMonth of [1, 31]) {
        const req = createMockRequest({
          params: { planId: validPlanId },
          body: rentBody({ repeatMonthly: { dayOfMonth } }),
          tokenUserId: userId,
        });
        const res = createMockResponse();

        await TransactionHandler.createTransaction(req, res as any);
        expect(res.statusCode).toBe(201);
      }
    });

    it("should return 400 for a day outside 1 to 31, a fraction or a non-number", async () => {
      for (const dayOfMonth of [0, 32, -1, 15.5, "15", null, NaN]) {
        const req = createMockRequest({
          params: { planId: validPlanId },
          body: rentBody({ repeatMonthly: { dayOfMonth } }),
          tokenUserId: userId,
        });
        const res = createMockResponse();

        await TransactionHandler.createTransaction(req, res as any);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("dayOfMonth");
      }
      expect(MonthlyPaymentRepository.createWithTransaction).not.toHaveBeenCalled();
    });

    it("should return 400 when repeatMonthly is not an object with a day", async () => {
      for (const repeatMonthly of ["monthly", true, [], {}]) {
        const req = createMockRequest({
          params: { planId: validPlanId },
          body: rentBody({ repeatMonthly }),
          tokenUserId: userId,
        });
        const res = createMockResponse();

        await TransactionHandler.createTransaction(req, res as any);
        expect(res.statusCode).toBe(400);
      }
    });

    it("should return 400 when the amount is money in (positive)", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: rentBody({ amount: 8500 }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("money out");
      expect(MonthlyPaymentRepository.createWithTransaction).not.toHaveBeenCalled();
    });

    it("should return 400 for a savings transaction", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: {
          amount: 500,
          date: "2026-10-05",
          type: "SAVING",
          savingsGoalId: "523e4567-e89b-12d3-a456-426614174004",
          repeatMonthly: { dayOfMonth: 25 },
        },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("expense");
      expect(MonthlyPaymentRepository.createWithTransaction).not.toHaveBeenCalled();
    });

    it("should create a normal transaction when repeatMonthly is left out or null", async () => {
      for (const repeatMonthly of [undefined, null]) {
        const req = createMockRequest({
          params: { planId: validPlanId },
          body: rentBody({ repeatMonthly }),
          tokenUserId: userId,
        });
        const res = createMockResponse();

        await TransactionHandler.createTransaction(req, res as any);
        expect(res.statusCode).toBe(201);
      }
      expect(MonthlyPaymentRepository.createWithTransaction).not.toHaveBeenCalled();
      expect(TransactionRepository.createTransaction).toHaveBeenCalledTimes(2);
    });

    it("should return 500 when the repository throws", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(MonthlyPaymentRepository.createWithTransaction).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({ params: { planId: validPlanId }, body: rentBody(), tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(500);
    });
  });

  describe("updateTransaction with repeatMonthly", () => {
    it("should return 400: repeating can only be set when creating", async () => {
      const req = createMockRequest({ params: { id: validTxId }, body: rentBody(), tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("created");
      expect(TransactionRepository.updateTransaction).not.toHaveBeenCalled();
    });

    it("should still update a transaction made by a monthly payment, only that month", async () => {
      const req = createMockRequest({
        params: { id: validTxId },
        body: rentBody({ repeatMonthly: undefined, amount: -9000 }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(MonthlyPaymentRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe("deleteTransaction with stopRepeating", () => {
    it("should delete only the transaction by default", async () => {
      const req = createMockRequest({ params: { id: validTxId }, tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(TransactionRepository.deleteTransaction).toHaveBeenCalledWith(validTxId);
      expect(MonthlyPaymentRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should delete only the transaction with stopRepeating=false", async () => {
      const req = createMockRequest({
        params: { id: validTxId },
        query: { stopRepeating: "false" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(MonthlyPaymentRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should also stop the payment with stopRepeating=true", async () => {
      const req = createMockRequest({
        params: { id: validTxId },
        query: { stopRepeating: "true" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(204);
      // Both are deleted together, in one database transaction
      expect(TransactionRepository.deleteTransaction).toHaveBeenCalledWith(validTxId, paymentId);
      expect(MonthlyPaymentRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should only delete the transaction when it was not made by a payment", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValue({
        id: validTxId,
        budgetPlanId: validPlanId,
        monthlyPaymentId: null,
      } as any);

      const req = createMockRequest({
        params: { id: validTxId },
        query: { stopRepeating: "true" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(MonthlyPaymentRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should return 400 for any other value of stopRepeating", async () => {
      const req = createMockRequest({
        params: { id: validTxId },
        query: { stopRepeating: "yes" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("stopRepeating");
      expect(TransactionRepository.deleteTransaction).not.toHaveBeenCalled();
    });
  });

  describe("creating the due monthly payments before reading", () => {
    it("should do it before listing the transactions", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        query: { month: "2026-10" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(MonthlyPaymentService.ensureGenerated).toHaveBeenCalledWith(validPlanId);
      const generated = vi.mocked(MonthlyPaymentService.ensureGenerated).mock.invocationCallOrder[0];
      const listed = vi.mocked(TransactionRepository.findByPlanId).mock.invocationCallOrder[0];
      expect(generated).toBeLessThan(listed);
    });

    it("should do it for any month, even one in the past", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        query: { month: "2025-01" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(MonthlyPaymentService.ensureGenerated).toHaveBeenCalledWith(validPlanId);
    });

    it("should not do it for an unauthorized request, an unknown plan or a bad query", async () => {
      const noToken = createMockRequest({ params: { planId: validPlanId } });
      await TransactionHandler.getTransactions(noToken, createMockResponse() as any);

      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);
      const unknownPlan = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      await TransactionHandler.getTransactions(unknownPlan, createMockResponse() as any);

      const badMonth = createMockRequest({
        params: { planId: validPlanId },
        query: { month: "nope" },
        tokenUserId: userId,
      });
      await TransactionHandler.getTransactions(badMonth, createMockResponse() as any);

      expect(MonthlyPaymentService.ensureGenerated).not.toHaveBeenCalled();
    });

    it("should do it before building the overview, so the spending adds up", async () => {
      vi.mocked(OverviewRepository.getMonthlyOverview).mockResolvedValueOnce({ month: "2026-10" } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        query: { month: "2026-10" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await OverviewHandler.getOverview(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(MonthlyPaymentService.ensureGenerated).toHaveBeenCalledWith(validPlanId);
      const generated = vi.mocked(MonthlyPaymentService.ensureGenerated).mock.invocationCallOrder[0];
      const built = vi.mocked(OverviewRepository.getMonthlyOverview).mock.invocationCallOrder[0];
      expect(generated).toBeLessThan(built);
    });

    it("should not do it for an overview request without a valid month", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await OverviewHandler.getOverview(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(MonthlyPaymentService.ensureGenerated).not.toHaveBeenCalled();
    });
  });
});
