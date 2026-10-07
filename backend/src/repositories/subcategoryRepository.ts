import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { categories, subcategories, budgetPlans, SubcategoryModel, NewSubcategoryModel } from "../db/schema";

export namespace SubcategoryRepository {
  /**
   * Find a subcategory by ID
   */
  export async function findSubcategoryById(subcategoryId: string) {
    return db
      .select()
      .from(subcategories)
      .where(eq(subcategories.id, subcategoryId))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Find a subcategory by ID verifying it belongs to the authenticated user's category
   */
  export async function findSubcategoryByIdAndUserId(subcategoryId: string, userId: number) {
    const rows = await db
      .select({ subcategory: subcategories })
      .from(subcategories)
      .innerJoin(categories, eq(subcategories.categoryId, categories.id))
      .innerJoin(budgetPlans, eq(categories.budgetPlanId, budgetPlans.id))
      .where(and(eq(subcategories.id, subcategoryId), eq(budgetPlans.userId, userId)))
      .limit(1);
    return rows[0]?.subcategory ?? null;
  }

  /**
   * List all subcategories for a category
   */
  export async function findSubcategoriesByCategoryId(categoryId: string) {
    return db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId));
  }

  /**
   * Create a subcategory
   */
  export async function createSubcategory(data: NewSubcategoryModel) {
    const [created] = await db.insert(subcategories).values(data).returning();
    return created;
  }

  /**
   * Update a subcategory
   */
  export async function updateSubcategory(subcategoryId: string, data: Pick<SubcategoryModel, "name" | "limit">) {
    const [updated] = await db.update(subcategories).set(data).where(eq(subcategories.id, subcategoryId)).returning();
    return updated ?? null;
  }

  /**
   * Delete a subcategory
   */
  export async function deleteSubcategory(subcategoryId: string) {
    const result = await db.delete(subcategories).where(eq(subcategories.id, subcategoryId)).returning();
    return result.length > 0;
  }

  /**
   * Check if a subcategory belongs to a specific category
   */
  export async function isSubcategoryOfCategory(subcategoryId: string, categoryId: string) {
    const subcat = await db
      .select()
      .from(subcategories)
      .where(and(eq(subcategories.id, subcategoryId), eq(subcategories.categoryId, categoryId)))
      .limit(1)
      .then((rows) => rows[0]);
    return !!subcat;
  }
}
