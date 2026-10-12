import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { categories, budgetPlans, CategoryModel, NewCategoryModel } from "../db/schema";

export namespace CategoryRepository {
  /**
   * Find a category by ID
   */
  export async function findCategoryById(categoryId: string) {
    return db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Find a category by ID, verifying it belongs to the authenticated user (via plan)
   */
  export async function findCategoryByIdAndUserId(categoryId: string, userId: number) {
    const rows = await db
      .select({ category: categories })
      .from(categories)
      .innerJoin(budgetPlans, eq(categories.budgetPlanId, budgetPlans.id))
      .where(and(eq(categories.id, categoryId), eq(budgetPlans.userId, userId)))
      .limit(1);
    return rows[0]?.category ?? null;
  }

  /**
   * List all categories for a plan
   */
  export async function findCategoriesByPlanId(planId: string) {
    return db.select().from(categories).where(eq(categories.budgetPlanId, planId)).orderBy(categories.createdAt);
  }

  /**
   * Create a category
   */
  export async function createCategory(data: NewCategoryModel) {
    const [created] = await db.insert(categories).values(data).returning();
    return created;
  }

  /**
   * Update a category
   */
  export async function updateCategory(categoryId: string, data: Pick<CategoryModel, "name" | "maxBudget">) {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, categoryId)).returning();
    return updated ?? null;
  }

  /**
   * Delete a category
   */
  export async function deleteCategory(categoryId: string) {
    const result = await db.delete(categories).where(eq(categories.id, categoryId)).returning();
    return result.length > 0;
  }
}
