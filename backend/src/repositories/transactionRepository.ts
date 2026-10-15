import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { transactions, NewTransactionModel, TagModel } from "../db/schema";
import { TagRepository } from "./tagRepository";

type TransactionTags = Pick<TagModel, "id" | "name" | "color">[];

export namespace TransactionRepository {
  /**
   * Find a transaction by ID
   */
  export async function findById(id: string) {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Find transactions for a specific plan with optional month, categoryId, and type filters.
   * Sorted by date descending (newest first).
   */
  export async function findByPlanId(
    planId: string,
    filters?: { month?: string; categoryId?: string; type?: "EXPENSE" | "SAVING" },
  ) {
    const conditions = [eq(transactions.budgetPlanId, planId)];

    if (filters?.month) {
      const monthPrefix = `${filters.month.trim()}%`;
      conditions.push(sql`${transactions.date}::text LIKE ${monthPrefix}`);
    }

    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }

    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    const rows = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    const tagsByTransaction = await TagRepository.findByTransactionIds(rows.map((row) => row.id));
    return rows.map((row) => formatTransaction(row, tagsByTransaction.get(row.id) ?? []));
  }

  /**
   * Create a new transaction, with its tags (if any)
   */
  export async function createTransaction(data: NewTransactionModel, tagIds: string[] = []) {
    const [tx] = await db.insert(transactions).values(data).returning();
    if (tagIds.length > 0) await TagRepository.setTransactionTags(tx.id, tagIds);
    const tagsByTransaction = await TagRepository.findByTransactionIds([tx.id]);
    return formatTransaction(tx, tagsByTransaction.get(tx.id) ?? []);
  }

  /**
   * Update an existing transaction. The tags are replaced only when `tagIds` is given.
   */
  export async function updateTransaction(id: string, data: Partial<NewTransactionModel>, tagIds?: string[]) {
    const [tx] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    if (tagIds !== undefined) await TagRepository.setTransactionTags(id, tagIds);
    const tagsByTransaction = await TagRepository.findByTransactionIds([id]);
    return formatTransaction(tx, tagsByTransaction.get(id) ?? []);
  }

  /**
   * Delete a transaction by ID
   */
  export async function deleteTransaction(id: string) {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  /**
   * Format transaction DB record for JSON output
   */
  function formatTransaction(tx: typeof transactions.$inferSelect, tags: TransactionTags) {
    return {
      id: tx.id,
      amount: parseFloat(tx.amount),
      date: tx.date,
      description: tx.description || undefined,
      type: tx.type,
      categoryId: tx.categoryId || undefined,
      subcategoryId: tx.subcategoryId || undefined,
      savingsGoalId: tx.savingsGoalId || undefined,
      tags,
    };
  }
}
