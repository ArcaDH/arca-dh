import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { savingsGoals, transactions, NewSavingsGoalModel } from "../db/schema";

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
   * Find savings goals by budget plan ID, returning computed savedAmount and progress
   */
  export async function findByPlanId(planId: string) {
    const goals = await db.select().from(savingsGoals).where(eq(savingsGoals.budgetPlanId, planId));

    const result = [];
    for (const goal of goals) {
      const goalProgress = await getGoalWithProgress(goal);
      result.push(goalProgress);
    }
    return result;
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
      savedAmount: 0,
      progress: 0,
    };
  }
}
