import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { incomeSources, budgetPlans, IncomeSourceModel, NewIncomeSourceModel } from "../db/schema";

export namespace IncomeSourceRepository {
  /**
   * Find an income source by ID
   */
  export async function findById(id: string) {
    return db
      .select()
      .from(incomeSources)
      .where(eq(incomeSources.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Find an income source by ID, verifying it belongs to the authenticated user (via plan)
   */
  export async function findByIdAndUserId(id: string, userId: number) {
    const rows = await db
      .select({ incomeSource: incomeSources })
      .from(incomeSources)
      .innerJoin(budgetPlans, eq(incomeSources.budgetPlanId, budgetPlans.id))
      .where(and(eq(incomeSources.id, id), eq(budgetPlans.userId, userId)))
      .limit(1);
    return rows[0]?.incomeSource ?? null;
  }

  /**
   * List all income sources for a plan
   */
  export async function findByPlanId(planId: string) {
    return db.select().from(incomeSources).where(eq(incomeSources.budgetPlanId, planId));
  }

  /**
   * Create an income source
   */
  export async function createIncomeSource(data: NewIncomeSourceModel) {
    const [created] = await db.insert(incomeSources).values(data).returning();
    return created;
  }

  /**
   * Update an income source
   */
  export async function updateIncomeSource(id: string, data: Pick<IncomeSourceModel, "name" | "monthlyAmount">) {
    const [updated] = await db.update(incomeSources).set(data).where(eq(incomeSources.id, id)).returning();
    return updated ?? null;
  }

  /**
   * Delete an income source
   */
  export async function deleteIncomeSource(id: string) {
    const result = await db.delete(incomeSources).where(eq(incomeSources.id, id)).returning();
    return result.length > 0;
  }
}
