import { eq } from "drizzle-orm";
import { db } from "../db";
import { User, NewUserModel } from "../db/schema";

export namespace UserRepository {
  /** Find user by ID. */
  export async function findById(userId: number) {
    return db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /** Find user by email. */
  export async function findByEmail(email: string) {
    return db
      .select()
      .from(User)
      .where(eq(User.email, email))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /** Find user by username. */
  export async function findByUsername(username: string) {
    return db
      .select()
      .from(User)
      .where(eq(User.username, username))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /** Create a new user. */
  export async function createUser(userData: NewUserModel) {
    const [user] = await db.insert(User).values(userData).returning();
    return user;
  }

  /** Update user profile information. */
  export async function updateUser(userId: number, modifications: Partial<NewUserModel>) {
    await db.update(User).set(modifications).where(eq(User.userId, userId));
  }

  /** Update user's current plan ID. */
  export async function updateCurrentPlanId(userId: number, planId: string | null) {
    await db.update(User).set({ currentPlanId: planId }).where(eq(User.userId, userId));
  }

  /** Delete a user (cascades to plans and tags). */
  export async function deleteUser(userId: number) {
    await db.delete(User).where(eq(User.userId, userId));
  }
}
