import type { CategoryWithSubcategories } from "@/types/category";
import type { SavingsGoal } from "@/types/goal";
import type { ForGroup } from "@/types/transaction";

// The form's "For" list: each category with its subcategories (or itself, when it has none), then the savings goals
export function forGroups(categories: CategoryWithSubcategories[], goals: SavingsGoal[]): ForGroup[] {
  const categoryGroups = categories.map((category) => ({
    label: category.name,
    options:
      category.subcategories.length > 0
        ? category.subcategories.map((sub) => ({
            id: sub.id,
            label: sub.name,
            target: { type: "EXPENSE" as const, categoryId: category.id, subcategoryId: sub.id },
          }))
        : [{ id: category.id, label: category.name, target: { type: "EXPENSE" as const, categoryId: category.id } }],
  }));
  const goalGroup = {
    label: "Savings goals",
    options: goals.map((goal) => ({
      id: goal.id,
      label: goal.name,
      target: { type: "SAVING" as const, savingsGoalId: goal.id },
    })),
  };
  return goals.length > 0 ? [...categoryGroups, goalGroup] : categoryGroups;
}
