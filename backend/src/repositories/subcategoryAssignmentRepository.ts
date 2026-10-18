import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { budgetPlans, categories, subcategories, subcategoryAssignments, transactions } from "../db/schema";

export namespace SubcategoryAssignmentRepository {
  /**
   * Set (insert or update) the money assigned to a subcategory in a given month.
   * Returns the stored row.
   */
  export async function setAssigned(subcategoryId: string, month: string, assigned: string) {
    const [row] = await db
      .insert(subcategoryAssignments)
      .values({ subcategoryId, month, assigned })
      .onConflictDoUpdate({
        target: [subcategoryAssignments.subcategoryId, subcategoryAssignments.month],
        set: { assigned },
      })
      .returning();
    return row;
  }

  /**
   * Set the same assigned amount on several subcategories for a month. Returns the stored rows.
   */
  export async function setAssignedMany(subcategoryIds: string[], month: string, assigned: string) {
    if (subcategoryIds.length === 0) return [];
    const rows = [];
    for (const subcategoryId of subcategoryIds) {
      rows.push(await setAssigned(subcategoryId, month, assigned));
    }
    return rows;
  }

  /**
   * List the subcategories of a plan together with the amount assigned to each in a month.
   * assigned is null when the subcategory has no assignment that month.
   */
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

  /**
   * Among the given subcategory ids, keep only those that belong to the user and plan.
   * Returns their id, target, the current assignment for the month, and the money spent
   * (sum of EXPENSE transactions) in that month.
   */
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
        // Spent this month on this subcategory. Expenses are stored negative, so negate to a positive spent.
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
