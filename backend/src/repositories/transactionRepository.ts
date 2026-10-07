import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { transactions, NewTransactionModel } from "../db/schema";

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

    return rows.map(formatTransaction);
  }

  /**
   * Create a new transaction
   */
  export async function createTransaction(data: NewTransactionModel) {
    const [tx] = await db.insert(transactions).values(data).returning();
    return formatTransaction(tx);
  }

  /**
   * Update an existing transaction
   */
  export async function updateTransaction(id: string, data: Partial<NewTransactionModel>) {
    const [tx] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return formatTransaction(tx);
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
  function formatTransaction(tx: typeof transactions.$inferSelect) {
    return {
      id: tx.id,
      amount: parseFloat(tx.amount),
      date: tx.date,
      description: tx.description || undefined,
      type: tx.type,
      categoryId: tx.categoryId || undefined,
      subcategoryId: tx.subcategoryId || undefined,
      savingsGoalId: tx.savingsGoalId || undefined,
    };
  }
}
