import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { categories, subcategories } from "../db/schema";

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
