import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { budgetPlans } from "../db/schema";

export namespace PlanRepository {
  /**
   * Fetch all budget plans for a specific user
   */
  export async function findByUserId(userId: number) {
    return db.select().from(budgetPlans).where(eq(budgetPlans.userId, userId));
  }

  /**
   * Find a budget plan by ID and user ID
   */
  export async function findByIdAndUserId(planId: string, userId: number) {
    return db
      .select()
      .from(budgetPlans)
      .where(and(eq(budgetPlans.id, planId), eq(budgetPlans.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Create a new budget plan
   */
  export async function createPlan(planData: { name: string; userId: number }) {
    const [newPlan] = await db.insert(budgetPlans).values(planData).returning();
    return newPlan;
  }

  /**
   * Update an existing budget plan
   */
  export async function updatePlan(planId: string, modifications: { name?: string }) {
    await db.update(budgetPlans).set(modifications).where(eq(budgetPlans.id, planId));
  }

  /**
   * Delete a budget plan by ID
   */
  export async function deletePlan(planId: string) {
    await db.delete(budgetPlans).where(eq(budgetPlans.id, planId));
  }
}
