import { SubcategoryAssignmentRepository } from "../repositories/subcategoryAssignmentRepository";

// Parse numeric amount from DB string, defaulting null to 0
const assignedAmount = (value: string | null): number => (value === null ? 0 : Number.parseFloat(value));

/** Business logic for bulk budget assignments. */
export namespace SubcategoryAssignmentService {
  /** Fund target amounts for under-funded subcategories in a month. */
  export async function fundTargets(subcategoryIds: string[], userId: number, planId: string, month: string) {
    const owned = await SubcategoryAssignmentRepository.findOwnedWithAssignment(subcategoryIds, userId, planId, month);
    const entries = owned
      .filter((sub) => sub.target !== null)
      .filter((sub) => assignedAmount(sub.assigned) < Number.parseFloat(sub.target as string))
      .map((sub) => ({
        subcategoryId: sub.subcategoryId,
        assigned: Number.parseFloat(sub.target as string).toString(),
      }));
    return SubcategoryAssignmentRepository.setAssignedEach(entries, month);
  }

  /** Assign a fixed amount to multiple subcategories for a month. */
  export async function assignToEach(
    subcategoryIds: string[],
    userId: number,
    planId: string,
    month: string,
    assigned: string,
  ) {
    const owned = await SubcategoryAssignmentRepository.findOwnedWithAssignment(subcategoryIds, userId, planId, month);
    const ownedIds = owned.map((sub) => sub.subcategoryId);
    return SubcategoryAssignmentRepository.setAssignedMany(ownedIds, month, assigned);
  }

  /** Top up assigned amounts to match spending for overspent subcategories. */
  export async function coverOverspending(subcategoryIds: string[], userId: number, planId: string, month: string) {
    const owned = await SubcategoryAssignmentRepository.findOwnedWithAssignment(subcategoryIds, userId, planId, month);
    const entries = owned
      .filter((sub) => Number.parseFloat(sub.spent) > assignedAmount(sub.assigned))
      .map((sub) => ({ subcategoryId: sub.subcategoryId, assigned: Number.parseFloat(sub.spent).toString() }));
    return SubcategoryAssignmentRepository.setAssignedEach(entries, month);
  }
}
