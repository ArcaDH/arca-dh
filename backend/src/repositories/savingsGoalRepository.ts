import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { savingsGoals, budgetPlans, transactions, NewSavingsGoalModel, SavingsGoalModel } from "../db/schema";

export namespace SavingsGoalRepository {
  /**
   * Find a savings goal by ID
   */
  export async function findById(goalId: string) {
    return db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, goalId))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Find a savings goal by ID, verifying it belongs to the given user (via plan ownership)
   */
  export async function findByIdAndUserId(goalId: string, userId: number) {
    const rows = await db
      .select({ goal: savingsGoals })
      .from(savingsGoals)
      .innerJoin(budgetPlans, eq(savingsGoals.budgetPlanId, budgetPlans.id))
      .where(and(eq(savingsGoals.id, goalId), eq(budgetPlans.userId, userId)))
      .limit(1);
    return rows[0]?.goal ?? null;
  }

  /**
   * Find savings goals by budget plan ID, returning computed savedAmount and progress
   */
  export async function findByPlanId(planId: string) {
    const goals = await db.select().from(savingsGoals).where(eq(savingsGoals.budgetPlanId, planId));

    return Promise.all(goals.map(getGoalWithProgress));
  }

  /**
   * Calculate savedAmount and progress for a single goal
   */
  export async function getGoalWithProgress(goal: typeof savingsGoals.$inferSelect) {
    const [sumResult] = await db
      .select({
        totalSaved: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.savingsGoalId, goal.id), eq(transactions.type, "SAVING")));

    const savedAmount = parseFloat(sumResult?.totalSaved || "0");
    const targetAmount = parseFloat(goal.targetAmount);
    const progress = targetAmount > 0 ? parseFloat((savedAmount / targetAmount).toFixed(4)) : 0;

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: targetAmount,
      deadline: goal.deadline || null,
      monthlyAmount: goal.monthlyAmount === null ? null : parseFloat(goal.monthlyAmount),
      savedAmount: savedAmount,
      progress: progress,
    };
  }

  /**
   * Create a new savings goal
   */
  export async function createGoal(goalData: NewSavingsGoalModel) {
    const [newGoal] = await db.insert(savingsGoals).values(goalData).returning();

    return {
      id: newGoal.id,
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      deadline: newGoal.deadline || null,
      monthlyAmount: newGoal.monthlyAmount === null ? null : parseFloat(newGoal.monthlyAmount),
      savedAmount: 0,
      progress: 0,
    };
  }

  /**
   * Update an existing savings goal
   */
  export async function updateGoal(
    goalId: string,
    data: Pick<SavingsGoalModel, "name" | "targetAmount" | "deadline" | "monthlyAmount">,
  ) {
    const [updated] = await db.update(savingsGoals).set(data).where(eq(savingsGoals.id, goalId)).returning();

    if (!updated) return null;
    return getGoalWithProgress(updated);
  }

  /**
   * Delete a savings goal by ID, together with the money saved toward it.
   */
  export async function deleteGoal(goalId: string) {
    return db.transaction(async (tx) => {
      await tx.delete(transactions).where(eq(transactions.savingsGoalId, goalId));
      const result = await tx.delete(savingsGoals).where(eq(savingsGoals.id, goalId)).returning();
      return result.length > 0;
    });
  }
}
