import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { transactions, transactionTags } from "../db/schema";
import { ListTransactionsQuery } from "../models/transaction.model";

type NewTransaction = typeof transactions.$inferInsert;

// Every read returns a transaction together with its category, subcategory and tags
const withRelations = {
  category: true,
  subcategory: true,
  tags: { with: { tag: true } },
} as const;

// % and _ are wildcards in LIKE, so they are escaped to search for the literal characters
const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

function buildWhere(planId: string, query: ListTransactionsQuery): SQL | undefined {
  const conditions: SQL[] = [eq(transactions.budgetPlanId, planId)];

  if (query.q) conditions.push(ilike(transactions.description, `%${escapeLike(query.q)}%`));
  if (query.categoryId) conditions.push(eq(transactions.categoryId, query.categoryId));
  if (query.from) conditions.push(gte(transactions.date, query.from));
  if (query.to) conditions.push(lte(transactions.date, query.to));
  if (query.minAmount !== undefined) conditions.push(gte(transactions.amount, query.minAmount));
  if (query.maxAmount !== undefined) conditions.push(lte(transactions.amount, query.maxAmount));

  if (query.tagIds.length > 0) {
    // "any" needs at least one of the picked tags, "all" needs every one of them
    const needed = query.tagMode === "all" ? query.tagIds.length : 1;
    conditions.push(
      inArray(
        transactions.id,
        db
          .select({ id: transactionTags.transactionId })
          .from(transactionTags)
          .where(inArray(transactionTags.tagId, query.tagIds))
          .groupBy(transactionTags.transactionId)
          .having(sql`count(distinct ${transactionTags.tagId}) >= ${needed}`),
      ),
    );
  }

  return and(...conditions);
}

export const transactionsRepository = {
  /** Returns one row more than `query.limit`, so the caller can tell whether there is a next page. */
  list: (planId: string, query: ListTransactionsQuery) => {
    const sortColumn = query.sort === "amount" ? transactions.amount : transactions.date;
    const direction = query.dir === "asc" ? asc : desc;
    return db.query.transactions.findMany({
      where: buildWhere(planId, query),
      with: withRelations,
      // createdAt and id keep the order stable when dates or amounts are equal
      orderBy: [direction(sortColumn), desc(transactions.createdAt), asc(transactions.id)],
      limit: query.limit + 1,
    });
  },

  /** Only finds the transaction when it belongs to the given plan. */
  findInPlan: (id: string, planId: string) =>
    db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.budgetPlanId, planId)),
      with: withRelations,
    }),

  insertWithTags: (values: NewTransaction, tagIds: string[]) =>
    db.transaction(async (tx) => {
      const [created] = await tx.insert(transactions).values(values).returning();
      if (tagIds.length > 0) {
        await tx.insert(transactionTags).values(tagIds.map((tagId) => ({ transactionId: created.id, tagId })));
      }
      return created;
    }),

  remove: async (id: string, planId: string) =>
    (
      await db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.budgetPlanId, planId)))
        .returning()
    )[0],

  /** Total spent between two dates (inclusive), in öre. Only expenses count, and money put aside for a savings goal is not an expense. */
  expenseTotal: async (planId: string, from: string, to: string) => {
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)`.mapWith(Number) })
      .from(transactions)
      .where(
        and(
          eq(transactions.budgetPlanId, planId),
          eq(transactions.type, "EXPENSE"),
          isNull(transactions.savingsGoalId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      );
    return row.total;
  },
};
