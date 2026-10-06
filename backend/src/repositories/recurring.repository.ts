import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { recurringTransactions, tags, transactions, transactionTags } from "../db/schema";
import { dueDates, monthStart } from "../lib/dates";

type NewRecurring = typeof recurringTransactions.$inferInsert;

export const recurringRepository = {
  insert: async (values: NewRecurring) => (await db.insert(recurringTransactions).values(values).returning())[0],

  listActive: (planId: string) =>
    db.query.recurringTransactions.findMany({
      where: and(eq(recurringTransactions.budgetPlanId, planId), isNull(recurringTransactions.endedAt)),
      with: { category: true },
      orderBy: asc(recurringTransactions.createdAt),
    }),

  /** Stops an active monthly payment. Returns undefined when there is no active one with that id in the plan. */
  end: async (id: string, planId: string, endedAt: string) =>
    (
      await db
        .update(recurringTransactions)
        .set({ endedAt })
        .where(
          and(
            eq(recurringTransactions.id, id),
            eq(recurringTransactions.budgetPlanId, planId),
            isNull(recurringTransactions.endedAt),
          ),
        )
        .returning()
    )[0],

  /**
   * Creates the transactions of one monthly payment that came due since the last time, and moves
   * its "generated through" month forward. The template row is locked while this runs, so two
   * requests at the same moment (the page loading twice, two tabs) can't create the same month twice.
   * @returns How many transactions were created.
   */
  generateDue: (id: string, today: string) =>
    db.transaction(async (tx) => {
      const [template] = await tx
        .select()
        .from(recurringTransactions)
        .where(eq(recurringTransactions.id, id))
        .for("update");
      if (!template || template.endedAt) return 0;

      const dates = dueDates(template, today);
      if (dates.length === 0) return 0;

      // A tag deleted since the payment was set up is simply left out
      const existingTagIds =
        template.tagIds.length > 0
          ? (await tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, template.tagIds))).map((t) => t.id)
          : [];

      const created = await tx
        .insert(transactions)
        .values(
          dates.map((date) => ({
            amount: template.amount,
            date,
            description: template.description,
            type: "EXPENSE" as const,
            budgetPlanId: template.budgetPlanId,
            categoryId: template.categoryId,
            subcategoryId: template.subcategoryId,
            recurringTransactionId: template.id,
          })),
        )
        .returning({ id: transactions.id });

      if (existingTagIds.length > 0) {
        await tx
          .insert(transactionTags)
          .values(
            created.flatMap(({ id: transactionId }) => existingTagIds.map((tagId) => ({ transactionId, tagId }))),
          );
      }

      await tx
        .update(recurringTransactions)
        .set({ generatedThrough: monthStart(dates[dates.length - 1]) })
        .where(eq(recurringTransactions.id, id));

      return created.length;
    }),
};
