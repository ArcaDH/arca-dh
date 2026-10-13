import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionHandler } from "../../src/handlers/transactions";
import { TransactionRepository } from "../../src/repositories/transactionRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
import { CategoryRepository } from "../../src/repositories/categoryRepository";
import { SubcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { SavingsGoalRepository } from "../../src/repositories/savingsGoalRepository";
import { createMockRequest, createMockResponse } from "./helpers";

vi.mock("../../src/repositories/transactionRepository", () => ({
  TransactionRepository: {
    findByPlanId: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../../src/repositories/planRepository", () => ({
  PlanRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

vi.mock("../../src/repositories/categoryRepository", () => ({
  CategoryRepository: {
    findCategoryById: vi.fn(),
  },
}));

vi.mock("../../src/repositories/subcategoryRepository", () => ({
  SubcategoryRepository: {
    isSubcategoryOfCategory: vi.fn(),
  },
}));

vi.mock("../../src/repositories/savingsGoalRepository", () => ({
  SavingsGoalRepository: {
    findById: vi.fn(),
  },
}));

describe("TransactionHandler (transactions.ts)", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const validTxId = "223e4567-e89b-12d3-a456-426614174001";
  const validCategoryId = "323e4567-e89b-12d3-a456-426614174002";
  const validSubcategoryId = "423e4567-e89b-12d3-a456-426614174003";
  const validGoalId = "523e4567-e89b-12d3-a456-426614174004";
  const userId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTransactions", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId } });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if plan is not found for user", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 400 if month query filter format is invalid", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        query: { month: "2026-99" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("month");
    });

    it("should return 400 if categoryId query filter is not a valid UUID", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        query: { categoryId: "not-a-uuid" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("categoryId");
    });

    it("should return 400 if type query filter is not EXPENSE or SAVING", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        query: { type: "OTHER" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("type");
    });

    it("should return 200 with transactions on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      const txs = [{ id: validTxId, amount: "100.00", type: "EXPENSE", budgetPlanId: validPlanId }];
      vi.mocked(TransactionRepository.findByPlanId).mockResolvedValueOnce(txs as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        query: { month: "2026-10", categoryId: validCategoryId, type: "EXPENSE" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(txs);
      expect(TransactionRepository.findByPlanId).toHaveBeenCalledWith(validPlanId, {
        month: "2026-10",
        categoryId: validCategoryId,
        type: "EXPENSE",
      });
    });

    it("should return 500 when repository throws on getTransactions", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(TransactionRepository.findByPlanId).mockRejectedValueOnce(new Error("DB error"));

      const req = createMockRequest({ params: { planId: validPlanId }, tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.getTransactions(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("createTransaction", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: { amount: 50 } });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if validation fails (e.g. invalid amount)", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: { amount: "not-a-number", date: "2026-10-14", type: "EXPENSE" },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("amount");
    });

    it("should return 201 with created expense transaction on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(CategoryRepository.findCategoryById).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(SubcategoryRepository.isSubcategoryOfCategory).mockResolvedValueOnce(true);

      const createdTx = {
        id: validTxId,
        amount: "50.00",
        date: "2026-10-14",
        type: "EXPENSE",
        categoryId: validCategoryId,
        subcategoryId: validSubcategoryId,
        savingsGoalId: null,
        budgetPlanId: validPlanId,
      };
      vi.mocked(TransactionRepository.createTransaction).mockResolvedValueOnce(createdTx as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: {
          amount: 50,
          date: "2026-10-14",
          type: "EXPENSE",
          categoryId: validCategoryId,
          subcategoryId: validSubcategoryId,
        },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(createdTx);
    });

    it("should return 201 with created saving transaction on success", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(SavingsGoalRepository.findById).mockResolvedValueOnce({ id: validGoalId } as any);

      const createdTx = {
        id: validTxId,
        amount: "100.00",
        date: "2026-10-14",
        type: "SAVING",
        categoryId: null,
        subcategoryId: null,
        savingsGoalId: validGoalId,
        budgetPlanId: validPlanId,
      };
      vi.mocked(TransactionRepository.createTransaction).mockResolvedValueOnce(createdTx as any);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: {
          amount: 100,
          date: "2026-10-14",
          type: "SAVING",
          savingsGoalId: validGoalId,
        },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(createdTx);
    });

    it("should return 500 when repository fails on createTransaction", async () => {
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(CategoryRepository.findCategoryById).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(TransactionRepository.createTransaction).mockRejectedValueOnce(new Error("Insert error"));

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: {
          amount: 50,
          date: "2026-10-14",
          type: "EXPENSE",
          categoryId: validCategoryId,
        },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("updateTransaction", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validTxId }, body: { amount: 60 } });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if transaction is not found", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: validTxId },
        body: { amount: 60 },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ code: 404, message: "Transaction not found" });
    });

    it("should return 400 if transaction update validation fails", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValueOnce({
        id: validTxId,
        budgetPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);

      const req = createMockRequest({
        params: { id: validTxId },
        body: { amount: -500, date: "2026-10-14", type: "SAVING", savingsGoalId: validGoalId },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 200 with updated transaction on success", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValueOnce({
        id: validTxId,
        budgetPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(CategoryRepository.findCategoryById).mockResolvedValueOnce({ id: validCategoryId } as any);

      const updatedTx = {
        id: validTxId,
        amount: "75.00",
        date: "2026-10-14",
        type: "EXPENSE",
        categoryId: validCategoryId,
        subcategoryId: null,
        savingsGoalId: null,
      };
      vi.mocked(TransactionRepository.updateTransaction).mockResolvedValueOnce(updatedTx as any);

      const req = createMockRequest({
        params: { id: validTxId },
        body: { amount: 75, date: "2026-10-14", type: "EXPENSE", categoryId: validCategoryId },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updatedTx);
    });

    it("should return 500 when repository fails on updateTransaction", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValueOnce({
        id: validTxId,
        budgetPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(CategoryRepository.findCategoryById).mockResolvedValueOnce({ id: validCategoryId } as any);
      vi.mocked(TransactionRepository.updateTransaction).mockRejectedValueOnce(new Error("Update failed"));

      const req = createMockRequest({
        params: { id: validTxId },
        body: { amount: 75, date: "2026-10-14", type: "EXPENSE", categoryId: validCategoryId },
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });

  describe("deleteTransaction", () => {
    it("should return 401 if unauthorized", async () => {
      const req = createMockRequest({ params: { id: validTxId } });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 404 if transaction is not found", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValueOnce(null);

      const req = createMockRequest({ params: { id: validTxId }, tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(404);
    });

    it("should return 204 on successful delete", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValueOnce({
        id: validTxId,
        budgetPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(TransactionRepository.deleteTransaction).mockResolvedValueOnce(true as any);

      const req = createMockRequest({ params: { id: validTxId }, tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(204);
      expect(TransactionRepository.deleteTransaction).toHaveBeenCalledWith(validTxId);
    });

    it("should return 500 when repository fails on deleteTransaction", async () => {
      vi.mocked(TransactionRepository.findById).mockResolvedValueOnce({
        id: validTxId,
        budgetPlanId: validPlanId,
      } as any);
      vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValueOnce({ id: validPlanId } as any);
      vi.mocked(TransactionRepository.deleteTransaction).mockRejectedValueOnce(new Error("Delete failed"));

      const req = createMockRequest({ params: { id: validTxId }, tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.deleteTransaction(req, res as any);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ code: 500, message: "Internal server error" });
    });
  });
});
