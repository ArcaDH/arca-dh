import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { categories, subcategories } from "../db/schema";

export const categoriesRepository = {
  /** Only finds the category when it belongs to the given plan. */
  findInPlan: (id: string, planId: string) =>
    db.query.categories.findFirst({ where: and(eq(categories.id, id), eq(categories.budgetPlanId, planId)) }),

  findSubcategory: (id: string, categoryId: string) =>
    db.query.subcategories.findFirst({
      where: and(eq(subcategories.id, id), eq(subcategories.categoryId, categoryId)),
    }),

  listWithSubcategories: (planId: string) =>
    db.query.categories.findMany({
      where: eq(categories.budgetPlanId, planId),
      with: { subcategories: true },
      orderBy: asc(categories.name),
    }),
};
