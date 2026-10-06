import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

type NewUser = typeof users.$inferInsert;

export const usersRepository = {
  findById: (userId: number) => db.query.users.findFirst({ where: eq(users.userId, userId) }),

  findByEmail: (email: string) => db.query.users.findFirst({ where: eq(users.email, email) }),

  findByUsername: (username: string) => db.query.users.findFirst({ where: eq(users.username, username) }),

  insert: async (values: NewUser) => (await db.insert(users).values(values).returning())[0],

  setCurrentPlan: async (userId: number, planId: string) =>
    (await db.update(users).set({ currentPlanId: planId }).where(eq(users.userId, userId)).returning())[0],
};
