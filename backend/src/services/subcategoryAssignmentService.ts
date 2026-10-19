import { SubcategoryAssignmentRepository } from "../repositories/subcategoryAssignmentRepository";

// A stored numeric amount (DB numeric comes back as a string); null means nothing assigned yet.
const assignedAmount = (value: string | null): number => (value === null ? 0 : Number.parseFloat(value));

/**
 * Business rules for bulk budget assignment. Handlers stay thin: they validate the request and call
 * these, which decide which subcategories to change and by how much, then persist via the repository.
 */
export namespace SubcategoryAssignmentService {
  /**
   * Fund the targets of the given owned subcategories for a month: set each under-funded line that
   * has a target to its target. Lines without a target, or already at/above it, are left untouched.
   */
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

  /**
   * Assign the same amount to every given owned subcategory for a month.
   */
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

  /**
   * Cover overspending: for each owned subcategory whose spending exceeds its assigned money,
   * raise its assigned for the month to the amount spent. Lines that are not overspent are untouched.
   */
  export async function coverOverspending(subcategoryIds: string[], userId: number, planId: string, month: string) {
    const owned = await SubcategoryAssignmentRepository.findOwnedWithAssignment(subcategoryIds, userId, planId, month);
    const entries = owned
      .filter((sub) => Number.parseFloat(sub.spent) > assignedAmount(sub.assigned))
      .map((sub) => ({ subcategoryId: sub.subcategoryId, assigned: Number.parseFloat(sub.spent).toString() }));
    return SubcategoryAssignmentRepository.setAssignedEach(entries, month);
  }
}
