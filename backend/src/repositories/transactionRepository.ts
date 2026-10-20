import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { transactions, monthlyPayments, NewTransactionModel, TagModel } from "../db/schema";
import { TagRepository } from "./tagRepository";

type TransactionTags = Pick<TagModel, "id" | "name" | "color">[];

export namespace TransactionRepository {
  /** Find transaction by ID. */
  export async function findById(id: string) {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /** Find formatted transaction by ID with tags. */
  export async function findFormattedById(id: string) {
    const tx = await findById(id);
    if (!tx) return null;
    const tagsByTransaction = await TagRepository.findByTransactionIds([id]);
    return formatTransaction(tx, tagsByTransaction.get(id) ?? []);
  }

  /** Find transactions for a plan with optional month, category, and type filters. */
  export async function findByPlanId(
    planId: string,
    filters?: { month?: string; categoryId?: string; type?: "EXPENSE" | "SAVING" },
  ) {
    // Apply optional filters
    const conditions = [
      eq(transactions.budgetPlanId, planId),
      ...(filters?.month ? [sql`${transactions.date}::text LIKE ${`${filters.month.trim()}%`}`] : []),
      ...(filters?.categoryId ? [eq(transactions.categoryId, filters.categoryId)] : []),
      ...(filters?.type ? [eq(transactions.type, filters.type)] : []),
    ];

    const rows = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    const tagsByTransaction = await TagRepository.findByTransactionIds(rows.map((row) => row.id));
    return rows.map((row) => formatTransaction(row, tagsByTransaction.get(row.id) ?? []));
  }

  /** Create a transaction and associate its tags. */
  export async function createTransaction(data: NewTransactionModel, tagIds: string[] = []) {
    const [tx] = await db.insert(transactions).values(data).returning();
    if (tagIds.length > 0) await TagRepository.setTransactionTags(tx.id, tagIds);
    const tagsByTransaction = await TagRepository.findByTransactionIds([tx.id]);
    return formatTransaction(tx, tagsByTransaction.get(tx.id) ?? []);
  }

  /** Update a transaction and optionally replace its tags. */
  export async function updateTransaction(id: string, data: Partial<NewTransactionModel>, tagIds?: string[]) {
    const [tx] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    if (tagIds !== undefined) await TagRepository.setTransactionTags(id, tagIds);
    const tagsByTransaction = await TagRepository.findByTransactionIds([id]);
    return formatTransaction(tx, tagsByTransaction.get(id) ?? []);
  }

  /** Delete a transaction, optionally stopping recurring monthly payment atomically. */
  export async function deleteTransaction(id: string, alsoStopPaymentId?: string) {
    if (!alsoStopPaymentId) {
      await db.delete(transactions).where(eq(transactions.id, id));
      return;
    }

    await db.transaction(async (tx) => {
      await tx.delete(transactions).where(eq(transactions.id, id));
      await tx.delete(monthlyPayments).where(eq(monthlyPayments.id, alsoStopPaymentId));
    });
  }

  /** Format transaction record for JSON output. */
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
      monthlyPaymentId: tx.monthlyPaymentId || undefined,
      tags,
    };
  }
}
