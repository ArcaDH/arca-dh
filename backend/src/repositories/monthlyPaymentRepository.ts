import { eq, and, asc, inArray, lt, sql } from "drizzle-orm";
import { db } from "../db";
import {
  budgetPlans,
  monthlyPaymentTags,
  monthlyPayments,
  NewMonthlyPaymentModel,
  NewTransactionModel,
  tags,
  transactions,
  transactionTags,
} from "../db/schema";

type PaymentTags = { id: string; name: string; color: (typeof tags.$inferSelect)["color"] }[];

export namespace MonthlyPaymentRepository {
  /**
   * The monthly payments of a plan, oldest first, each with its tags
   */
  export async function findByPlanId(planId: string) {
    const rows = await db
      .select()
      .from(monthlyPayments)
      .where(eq(monthlyPayments.budgetPlanId, planId))
      .orderBy(asc(monthlyPayments.createdAt));

    const tagsByPayment = await findTagsByPaymentIds(rows.map((row) => row.id));
    return rows.map((row) => formatPayment(row, tagsByPayment.get(row.id) ?? []));
  }

  /**
   * Find a monthly payment by ID, verifying it belongs to the user (via its plan)
   */
  export async function findByIdAndUserId(id: string, userId: number) {
    const [row] = await db
      .select({ payment: monthlyPayments })
      .from(monthlyPayments)
      .innerJoin(budgetPlans, eq(monthlyPayments.budgetPlanId, budgetPlans.id))
      .where(and(eq(monthlyPayments.id, id), eq(budgetPlans.userId, userId)))
      .limit(1);
    return row ? formatPayment(row.payment, []) : null;
  }

  /**
   * Stop a monthly payment. The transactions it already made are kept, they only lose the link.
   */
  export async function deleteById(id: string) {
    const result = await db.delete(monthlyPayments).where(eq(monthlyPayments.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Create a monthly payment together with the transaction the user logged, which counts as that month's payment.
   * Both get the same tags. Everything happens in one database transaction. Returns the id of the transaction.
   */
  export async function createWithTransaction(
    payment: Omit<NewMonthlyPaymentModel, "id" | "createdAt">,
    transaction: Omit<NewTransactionModel, "id" | "monthlyPaymentId" | "monthlyPeriod">,
    tagIds: string[],
    period: string,
  ) {
    return db.transaction(async (tx) => {
      const [createdPayment] = await tx.insert(monthlyPayments).values(payment).returning();
      const [createdTransaction] = await tx
        .insert(transactions)
        .values({ ...transaction, monthlyPaymentId: createdPayment.id, monthlyPeriod: period })
        .returning();

      if (tagIds.length > 0) {
        await tx
          .insert(monthlyPaymentTags)
          .values(tagIds.map((tagId) => ({ monthlyPaymentId: createdPayment.id, tagId })));
        await tx
          .insert(transactionTags)
          .values(tagIds.map((tagId) => ({ transactionId: createdTransaction.id, tagId })));
      }
      return createdTransaction.id;
    });
  }

  /**
   * Create the transactions of a payment for the given months, copying its tags, and mark those months as handled.
   * The unique rule on (payment, month) stops a month from being created twice if two requests arrive together.
   */
  export async function createDueTransactions(
    payment: ReturnType<typeof formatPayment>,
    periods: { month: string; date: string }[],
  ) {
    if (periods.length === 0) return;
    const tagIds = payment.tags.map((tag) => tag.id);
    const lastMonth = periods.reduce((latest, { month }) => (month > latest ? month : latest), periods[0].month);

    await db.transaction(async (tx) => {
      // One insert for every month. A month that already exists is skipped by the unique rule.
      const created = await tx
        .insert(transactions)
        .values(
          periods.map(({ month, date }) => ({
            amount: payment.amount.toFixed(2),
            date,
            description: payment.description ?? null,
            type: "EXPENSE" as const,
            budgetPlanId: payment.budgetPlanId,
            categoryId: payment.categoryId,
            subcategoryId: payment.subcategoryId ?? null,
            monthlyPaymentId: payment.id,
            monthlyPeriod: month,
          })),
        )
        .onConflictDoNothing()
        .returning({ id: transactions.id });

      if (created.length > 0 && tagIds.length > 0) {
        await tx
          .insert(transactionTags)
          .values(created.flatMap(({ id }) => tagIds.map((tagId) => ({ transactionId: id, tagId }))));
      }

      await tx
        .update(monthlyPayments)
        .set({ generatedThrough: lastMonth })
        .where(and(eq(monthlyPayments.id, payment.id), lt(monthlyPayments.generatedThrough, lastMonth)));
    });
  }

  async function findTagsByPaymentIds(paymentIds: string[]) {
    const byPayment = new Map<string, PaymentTags>();
    if (paymentIds.length === 0) return byPayment;

    const rows = await db
      .select({ paymentId: monthlyPaymentTags.monthlyPaymentId, tag: tags })
      .from(monthlyPaymentTags)
      .innerJoin(tags, eq(monthlyPaymentTags.tagId, tags.id))
      .where(inArray(monthlyPaymentTags.monthlyPaymentId, paymentIds))
      .orderBy(asc(sql`lower(${tags.name})`));

    // One entry per payment
    const ids = [...new Set(rows.map((row) => row.paymentId))];
    return new Map<string, PaymentTags>(
      ids.map((id) => [
        id,
        rows
          .filter((row) => row.paymentId === id)
          .map((row) => ({ id: row.tag.id, name: row.tag.name, color: row.tag.color })),
      ]),
    );
  }

  /**
   * Format a monthly payment DB record for JSON output
   */
  function formatPayment(payment: typeof monthlyPayments.$inferSelect, paymentTags: PaymentTags) {
    return {
      id: payment.id,
      budgetPlanId: payment.budgetPlanId,
      amount: Number.parseFloat(payment.amount),
      description: payment.description || undefined,
      dayOfMonth: payment.dayOfMonth,
      generatedThrough: payment.generatedThrough,
      categoryId: payment.categoryId,
      subcategoryId: payment.subcategoryId || undefined,
      tags: paymentTags,
    };
  }
}
