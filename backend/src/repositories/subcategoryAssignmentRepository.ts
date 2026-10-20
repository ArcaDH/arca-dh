import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { budgetPlans, categories, subcategories, subcategoryAssignments, transactions } from "../db/schema";

// Drizzle DB or transaction executor handle
type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace SubcategoryAssignmentRepository {
  // Upsert assigned amount for a subcategory and month
  async function upsertAssigned(executor: Executor, subcategoryId: string, month: string, assigned: string) {
    const [row] = await executor
      .insert(subcategoryAssignments)
      .values({ subcategoryId, month, assigned })
      .onConflictDoUpdate({
        target: [subcategoryAssignments.subcategoryId, subcategoryAssignments.month],
        set: { assigned },
      })
      .returning();
    return row;
  }

  /** Upsert assigned amount for a subcategory in a month. */
  export async function setAssigned(subcategoryId: string, month: string, assigned: string) {
    return upsertAssigned(db, subcategoryId, month, assigned);
  }

  /** Set identical assigned amount across multiple subcategories. */
  export async function setAssignedMany(subcategoryIds: string[], month: string, assigned: string) {
    if (subcategoryIds.length === 0) return [];
    return db.transaction((tx) =>
      Promise.all(subcategoryIds.map((subcategoryId) => upsertAssigned(tx, subcategoryId, month, assigned))),
    );
  }

  /** Set individual assigned amounts for multiple subcategories. */
  export async function setAssignedEach(entries: { subcategoryId: string; assigned: string }[], month: string) {
    if (entries.length === 0) return [];
    return db.transaction((tx) =>
      Promise.all(entries.map((entry) => upsertAssigned(tx, entry.subcategoryId, month, entry.assigned))),
    );
  }

  /** List subcategories with assignments for a month. */
  export async function findPlanSubcategoriesWithAssignment(planId: string, month: string) {
    return db
      .select({
        subcategoryId: subcategories.id,
        target: subcategories.target,
        categoryId: subcategories.categoryId,
        assigned: subcategoryAssignments.assigned,
      })
      .from(subcategories)
      .innerJoin(categories, eq(subcategories.categoryId, categories.id))
      .leftJoin(
        subcategoryAssignments,
        and(eq(subcategoryAssignments.subcategoryId, subcategories.id), eq(subcategoryAssignments.month, month)),
      )
      .where(eq(categories.budgetPlanId, planId));
  }

  /** Find owned subcategories with current assignment and monthly spending. */
  export async function findOwnedWithAssignment(
    subcategoryIds: string[],
    userId: number,
    planId: string,
    month: string,
  ) {
    if (subcategoryIds.length === 0) return [];
    const monthPrefix = `${month}%`;
    return db
      .select({
        subcategoryId: subcategories.id,
        target: subcategories.target,
        assigned: subcategoryAssignments.assigned,
        // Monthly spending on subcategory (negate stored expense amount)
        spent: sql<string>`(
          SELECT -COALESCE(SUM(${transactions.amount}), 0)
          FROM ${transactions}
          WHERE ${transactions.subcategoryId} = ${subcategories.id}
            AND ${transactions.type} = 'EXPENSE'
            AND ${transactions.date}::text LIKE ${monthPrefix}
        )`,
      })
      .from(subcategories)
      .innerJoin(categories, eq(subcategories.categoryId, categories.id))
      .innerJoin(budgetPlans, eq(categories.budgetPlanId, budgetPlans.id))
      .leftJoin(
        subcategoryAssignments,
        and(eq(subcategoryAssignments.subcategoryId, subcategories.id), eq(subcategoryAssignments.month, month)),
      )
      .where(
        and(inArray(subcategories.id, subcategoryIds), eq(budgetPlans.userId, userId), eq(budgetPlans.id, planId)),
      );
  }
}
