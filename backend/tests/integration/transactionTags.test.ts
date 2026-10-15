import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionHandler } from "../../src/handlers/transactions";
import { TransactionRepository } from "../../src/repositories/transactionRepository";
import { PlanRepository } from "../../src/repositories/planRepository";
import { CategoryRepository } from "../../src/repositories/categoryRepository";
import { SubcategoryRepository } from "../../src/repositories/subcategoryRepository";
import { SavingsGoalRepository } from "../../src/repositories/savingsGoalRepository";
import { TagRepository } from "../../src/repositories/tagRepository";
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

vi.mock("../../src/repositories/tagRepository", () => ({
  TagRepository: {
    countByIdsAndUserId: vi.fn(),
  },
}));

describe("TransactionHandler with tags", () => {
  const validPlanId = "123e4567-e89b-12d3-a456-426614174000";
  const validTxId = "223e4567-e89b-12d3-a456-426614174001";
  const validCategoryId = "323e4567-e89b-12d3-a456-426614174002";
  const tagA = "623e4567-e89b-12d3-a456-426614174005";
  const tagB = "723e4567-e89b-12d3-a456-426614174006";
  const userId = 1;

  const expenseBody = (extra: Record<string, unknown> = {}) => ({
    amount: -50,
    date: "2026-10-14",
    type: "EXPENSE",
    categoryId: validCategoryId,
    ...extra,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PlanRepository.findByIdAndUserId).mockResolvedValue({ id: validPlanId } as any);
    vi.mocked(CategoryRepository.findCategoryById).mockResolvedValue({ id: validCategoryId } as any);
    vi.mocked(SubcategoryRepository.isSubcategoryOfCategory).mockResolvedValue(true);
    vi.mocked(SavingsGoalRepository.findById).mockResolvedValue({ id: "goal" } as any);
    vi.mocked(TransactionRepository.createTransaction).mockResolvedValue({ id: validTxId } as any);
    vi.mocked(TransactionRepository.findById).mockResolvedValue({ id: validTxId, budgetPlanId: validPlanId } as any);
    vi.mocked(TransactionRepository.updateTransaction).mockResolvedValue({ id: validTxId } as any);
  });

  describe("createTransaction", () => {
    it("should create without checking tags when 'tagIds' is left out", async () => {
      const req = createMockRequest({ params: { planId: validPlanId }, body: expenseBody(), tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(TagRepository.countByIdsAndUserId).not.toHaveBeenCalled();
      expect(TransactionRepository.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ budgetPlanId: validPlanId }),
        undefined,
      );
    });

    it("should pass the tag ids on when the tags belong to the user", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(2);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: [tagA, tagB] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(TagRepository.countByIdsAndUserId).toHaveBeenCalledWith([tagA, tagB], userId);
      expect(TransactionRepository.createTransaction).toHaveBeenCalledWith(expect.anything(), [tagA, tagB]);
    });

    it("should not save the tag ids as a column of the transaction", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(1);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: [tagA] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      const [fields] = vi.mocked(TransactionRepository.createTransaction).mock.calls[0];
      expect(fields).not.toHaveProperty("tagIds");
    });

    it("should count a tag sent twice only once", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(1);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: [tagA, tagA] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
      expect(TransactionRepository.createTransaction).toHaveBeenCalledWith(expect.anything(), [tagA]);
    });

    it("should accept an empty list of tags", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(0);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: [] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
    });

    it("should return 400 if 'tagIds' is not a list", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: tagA }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("tagIds");
      expect(TransactionRepository.createTransaction).not.toHaveBeenCalled();
    });

    it("should return 400 if a tag id is not a valid UUID", async () => {
      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: ["nope"] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 400 for more than 5 tags", async () => {
      const six = Array.from({ length: 6 }, (_, i) => `623e4567-e89b-12d3-a456-42661417400${i}`);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: six }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("5");
      expect(TagRepository.countByIdsAndUserId).not.toHaveBeenCalled();
    });

    it("should accept exactly 5 tags", async () => {
      const five = Array.from({ length: 5 }, (_, i) => `623e4567-e89b-12d3-a456-42661417400${i}`);
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(5);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: five }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(201);
    });

    it("should return 400 if a tag does not exist or belongs to another user", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(1);

      const req = createMockRequest({
        params: { planId: validPlanId },
        body: expenseBody({ tagIds: [tagA, tagB] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.createTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("tag");
      expect(TransactionRepository.createTransaction).not.toHaveBeenCalled();
    });
  });

  describe("updateTransaction", () => {
    it("should keep the current tags when 'tagIds' is left out", async () => {
      const req = createMockRequest({ params: { id: validTxId }, body: expenseBody(), tokenUserId: userId });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(TransactionRepository.updateTransaction).toHaveBeenCalledWith(validTxId, expect.anything(), undefined);
    });

    it("should replace the tags when 'tagIds' is given", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(1);

      const req = createMockRequest({
        params: { id: validTxId },
        body: expenseBody({ tagIds: [tagA] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(TransactionRepository.updateTransaction).toHaveBeenCalledWith(validTxId, expect.anything(), [tagA]);
    });

    it("should remove all tags when 'tagIds' is an empty list", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(0);

      const req = createMockRequest({
        params: { id: validTxId },
        body: expenseBody({ tagIds: [] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(200);
      expect(TransactionRepository.updateTransaction).toHaveBeenCalledWith(validTxId, expect.anything(), []);
    });

    it("should return 400 if a tag belongs to another user", async () => {
      vi.mocked(TagRepository.countByIdsAndUserId).mockResolvedValueOnce(0);

      const req = createMockRequest({
        params: { id: validTxId },
        body: expenseBody({ tagIds: [tagA] }),
        tokenUserId: userId,
      });
      const res = createMockResponse();

      await TransactionHandler.updateTransaction(req, res as any);
      expect(res.statusCode).toBe(400);
      expect(TransactionRepository.updateTransaction).not.toHaveBeenCalled();
    });
  });
});
