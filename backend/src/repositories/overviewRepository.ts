import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import {
  incomeSources,
  categories,
  subcategories,
  subcategoryAssignments,
  transactions,
  savingsGoals,
} from "../db/schema";

export namespace OverviewRepository {
  /** Get monthly overview metrics and progress for a plan and month (YYYY-MM). */
  export async function getMonthlyOverview(planId: string, month: string) {
    const monthPrefix = `${month}%`;

    // Negate negative expense amounts to yield positive spent values
    // Total income for plan
    const [incomeRow] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${incomeSources.monthlyAmount}), 0)`,
      })
      .from(incomeSources)
      .where(eq(incomeSources.budgetPlanId, planId));

    const totalIncome = parseFloat(incomeRow?.total || "0");

    // Total expenses in the month
    const [expenseRow] = await db
      .select({
        total: sql<string>`-COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.budgetPlanId, planId),
          eq(transactions.type, "EXPENSE"),
          sql`${transactions.date}::text LIKE ${monthPrefix}`,
        ),
      );

    const totalExpenses = parseFloat(expenseRow?.total || "0");

    // Total savings in the month
    const [savingRow] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.budgetPlanId, planId),
          eq(transactions.type, "SAVING"),
          sql`${transactions.date}::text LIKE ${monthPrefix}`,
        ),
      );

    const savings = parseFloat(savingRow?.total || "0");

    // Spending by category and subcategory
    const planCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.budgetPlanId, planId))
      .orderBy(categories.createdAt);

    const spendingByCategory = await Promise.all(
      planCategories.map(async (cat) => {
        const [catSpentRow] = await db
          .select({
            spent: sql<string>`-COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.budgetPlanId, planId),
              eq(transactions.categoryId, cat.id),
              eq(transactions.type, "EXPENSE"),
              sql`${transactions.date}::text LIKE ${monthPrefix}`,
            ),
          );

        const catSubcategories = await db
          .select({
            id: subcategories.id,
            name: subcategories.name,
            target: subcategories.target,
            assigned: subcategoryAssignments.assigned,
          })
          .from(subcategories)
          .leftJoin(
            subcategoryAssignments,
            and(eq(subcategoryAssignments.subcategoryId, subcategories.id), eq(subcategoryAssignments.month, month)),
          )
          .where(eq(subcategories.categoryId, cat.id))
          .orderBy(subcategories.createdAt);

        const subcategorySpending = await Promise.all(
          catSubcategories.map(async (sub) => {
            const [subSpentRow] = await db
              .select({
                spent: sql<string>`-COALESCE(SUM(${transactions.amount}), 0)`,
              })
              .from(transactions)
              .where(
                and(
                  eq(transactions.budgetPlanId, planId),
                  eq(transactions.subcategoryId, sub.id),
                  eq(transactions.type, "EXPENSE"),
                  sql`${transactions.date}::text LIKE ${monthPrefix}`,
                ),
              );

            return {
              subcategoryId: sub.id,
              name: sub.name,
              assigned: sub.assigned === null ? 0 : Number.parseFloat(sub.assigned),
              target: sub.target === null ? null : Number.parseFloat(sub.target),
              spent: parseFloat(subSpentRow?.spent || "0"),
            };
          }),
        );

        return {
          categoryId: cat.id,
          name: cat.name,
          maxBudget: parseFloat(cat.maxBudget),
          spent: parseFloat(catSpentRow?.spent || "0"),
          subcategories: subcategorySpending,
        };
      }),
    );

    // Savings goal progress
    const goals = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.budgetPlanId, planId))
      .orderBy(savingsGoals.deadline, savingsGoals.name);

    const goalProgress = await Promise.all(
      goals.map(async (goal) => {
        const [goalSavedRow] = await db
          .select({
            totalSaved: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
            savedThisMonth: sql<string>`COALESCE(SUM(${transactions.amount}) FILTER (WHERE ${transactions.date}::text LIKE ${monthPrefix}), 0)`,
          })
          .from(transactions)
          .where(and(eq(transactions.savingsGoalId, goal.id), eq(transactions.type, "SAVING")));

        const savedAmount = parseFloat(goalSavedRow?.totalSaved || "0");
        const savedThisMonth = parseFloat(goalSavedRow?.savedThisMonth || "0");
        const targetAmount = parseFloat(goal.targetAmount);
        const progress = targetAmount > 0 ? parseFloat((savedAmount / targetAmount).toFixed(4)) : 0;

        return {
          goalId: goal.id,
          name: goal.name,
          targetAmount,
          deadline: goal.deadline,
          createdAt: goal.createdAt,
          monthlyAmount: goal.monthlyAmount === null ? null : parseFloat(goal.monthlyAmount),
          savedAmount,
          savedThisMonth,
          progress,
        };
      }),
    );

    return {
      month,
      totalIncome,
      totalExpenses,
      remaining: totalIncome - totalExpenses - savings,
      savings,
      spendingByCategory,
      goalProgress,
    };
  }
}
