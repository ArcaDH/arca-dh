import { eq } from "drizzle-orm";
import { db } from "../db";
import { User, NewUserModel } from "../db/schema";

export namespace UserRepository {
  /**
   * Find a user by their ID
   */
  export async function findById(userId: number) {
    return db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Find a user by their email address
   */
  export async function findByEmail(email: string) {
    return db
      .select()
      .from(User)
      .where(eq(User.email, email))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Find a user by their username
   */
  export async function findByUsername(username: string) {
    return db
      .select()
      .from(User)
      .where(eq(User.username, username))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Create a new user
   */
  export async function createUser(userData: NewUserModel) {
    const [user] = await db.insert(User).values(userData).returning();
    return user;
  }

  /**
   * Update a user's profile information
   */
  export async function updateUser(userId: number, modifications: Partial<NewUserModel>) {
    await db
      .update(User)
      .set(modifications)
      .where(eq(User.userId, userId));
  }

  /**
   * Update a user's current (default) plan ID
   */
  export async function updateCurrentPlanId(userId: number, planId: string | null) {
    await db
      .update(User)
      .set({ currentPlanId: planId })
      .where(eq(User.userId, userId));
  }
}
