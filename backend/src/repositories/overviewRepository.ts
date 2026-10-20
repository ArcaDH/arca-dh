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
  /**
   * Build the full MonthlyOverview for a given plan and month (YYYY-MM).
   */
  export async function getMonthlyOverview(planId: string, month: string) {
    const monthPrefix = `${month}%`;

    // Expenses are stored as negative amounts (money out), so their sums are negated here to give a positive
    // "spent". Money in (a positive EXPENSE row) then lowers the total. Savings are stored positive and unchanged.

    // Total income; sum of all income sources for this plan
    const [incomeRow] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${incomeSources.monthlyAmount}), 0)`,
      })
      .from(incomeSources)
      .where(eq(incomeSources.budgetPlanId, planId));

    const totalIncome = parseFloat(incomeRow?.total || "0");

    // 2. Total expenses — sum of EXPENSE transactions in the given month
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

    // Total savings; sum of SAVING transactions in the given month
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

    // Spending by category (with subcategories)
    const planCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.budgetPlanId, planId))
      .orderBy(categories.createdAt);

    const spendingByCategory = await Promise.all(
      planCategories.map(async (cat) => {
        // Total spent in this category this month
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

        // Subcategories with their spending and the money assigned to them this month
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

    // Goal progress; all-time saved amounts, plus what was saved in the given month
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

    // Assemble response
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
