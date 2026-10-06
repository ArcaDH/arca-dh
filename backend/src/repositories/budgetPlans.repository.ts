import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { budgetPlans, NewBudgetPlanModel } from "../db/schema";

const ownedBy = (id: string, userId: number) => and(eq(budgetPlans.id, id), eq(budgetPlans.userId, userId));

export const budgetPlansRepository = {
  findByUser: (userId: number) => db.query.budgetPlans.findMany({ where: eq(budgetPlans.userId, userId) }),

  findById: (id: string, userId: number) => db.query.budgetPlans.findFirst({ where: ownedBy(id, userId) }),

  insert: async (values: NewBudgetPlanModel) => (await db.insert(budgetPlans).values(values).returning())[0],

  update: async (id: string, userId: number, values: { name: string }) =>
    (await db.update(budgetPlans).set(values).where(ownedBy(id, userId)).returning())[0],

  delete: async (id: string, userId: number) =>
    (await db.delete(budgetPlans).where(ownedBy(id, userId)).returning())[0],
};
