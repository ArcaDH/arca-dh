import { Request, Response } from "express";
import { SubcategoryRepository } from "../repositories/subcategoryRepository";
import { SubcategoryAssignmentRepository } from "../repositories/subcategoryAssignmentRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { PlanRepository } from "../repositories/planRepository";
import { returnJson, returnCode, authorizeRequest, userIdFromToken } from "../services/apiService";
import { validateSubcategoryData, validateAssignmentData, isValidMonth } from "../validators/subcategories";

export namespace SubcategoryHandler {
  /**
   * GET /categories/:id/subcategories
   * List subcategories of a category
   */
  export async function getSubcategories(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const categoryId = request.params.id as string;
      const category = await CategoryRepository.findCategoryByIdAndUserId(categoryId, userId);
      if (!category) {
        return returnJson(response, 404, { code: 404, message: "Category not found" });
      }

      const result = await SubcategoryRepository.findSubcategoriesByCategoryId(categoryId);
      return returnJson(response, 200, result);
    } catch (error) {
      console.error("Error in getSubcategories:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /categories/:id/subcategories
   * Create a subcategory under a category
   */
  export async function createSubcategory(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const categoryId = request.params.id as string;
      const category = await CategoryRepository.findCategoryByIdAndUserId(categoryId, userId);
      if (!category) {
        return returnJson(response, 404, { code: 404, message: "Category not found" });
      }

      const validData = validateSubcategoryData(request.body, response);
      if (!validData) return;

      const created = await SubcategoryRepository.createSubcategory({
        name: validData.name,
        target: validData.target,
        categoryId,
      });

      return returnJson(response, 201, created);
    } catch (error) {
      console.error("Error in createSubcategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /subcategories/:id
   * Update a subcategory
   */
  export async function updateSubcategory(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const subcategoryId = request.params.id as string;
      const existing = await SubcategoryRepository.findSubcategoryByIdAndUserId(subcategoryId, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Subcategory not found" });
      }

      const validData = validateSubcategoryData(request.body, response);
      if (!validData) return;

      const updated = await SubcategoryRepository.updateSubcategory(subcategoryId, {
        name: validData.name,
        target: validData.target,
      });

      return returnJson(response, 200, updated);
    } catch (error) {
      console.error("Error in updateSubcategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * DELETE /subcategories/:id
   * Delete a subcategory
   */
  export async function deleteSubcategory(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const subcategoryId = request.params.id as string;
      const existing = await SubcategoryRepository.findSubcategoryByIdAndUserId(subcategoryId, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Subcategory not found" });
      }

      await SubcategoryRepository.deleteSubcategory(subcategoryId);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteSubcategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /subcategories/:id/assignments/:month
   * Set the money assigned to a subcategory in a month (YYYY-MM).
   */
  export async function setAssignment(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const subcategoryId = request.params.id as string;
      const month = request.params.month as string;
      if (!isValidMonth(month)) {
        return returnJson(response, 400, { code: 400, message: "Invalid month. Expected YYYY-MM." });
      }

      const existing = await SubcategoryRepository.findSubcategoryByIdAndUserId(subcategoryId, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Subcategory not found" });
      }

      const validData = validateAssignmentData(request.body, response);
      if (!validData) return;

      const saved = await SubcategoryAssignmentRepository.setAssigned(subcategoryId, month, validData.assigned);
      return returnJson(response, 200, saved);
    } catch (error) {
      console.error("Error in setAssignment:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans/:planId/assignments/fund-targets
   * For each selected subcategory with a target, top up its assigned money for the month
   * to meet the target. Lines already at/above target are skipped; lines with no target are ignored.
   * Body: { month: "YYYY-MM", subcategoryIds: string[] }
   */
  export async function fundTargets(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const planId = request.params.planId as string;
      const { month, subcategoryIds } = request.body || {};

      if (!isValidMonth(month)) {
        return returnJson(response, 400, { code: 400, message: "Invalid month. Expected YYYY-MM." });
      }
      if (!Array.isArray(subcategoryIds) || subcategoryIds.some((id) => typeof id !== "string")) {
        return returnJson(response, 400, { code: 400, message: "Invalid input: 'subcategoryIds' must be an array." });
      }

      const plan = await PlanRepository.findByIdAndUserId(planId, userId);
      if (!plan) {
        return returnJson(response, 404, { code: 404, message: "Plan not found" });
      }

      // Only act on subcategories the user owns in this plan.
      const owned = await SubcategoryAssignmentRepository.findOwnedWithAssignment(
        subcategoryIds,
        userId,
        planId,
        month,
      );

      const funded = [];
      for (const sub of owned) {
        if (sub.target === null) continue; // no target: ignore
        const target = parseFloat(sub.target);
        const current = sub.assigned === null ? 0 : parseFloat(sub.assigned);
        if (current >= target) continue; // already funded: skip
        const saved = await SubcategoryAssignmentRepository.setAssigned(sub.subcategoryId, month, target.toString());
        funded.push(saved);
      }

      return returnJson(response, 200, { month, funded });
    } catch (error) {
      console.error("Error in fundTargets:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans/:planId/assignments/bulk
   * Assign the same amount to several subcategories for a month.
   * Body: { month: "YYYY-MM", subcategoryIds: string[], assigned: number }
   */
  export async function bulkAssign(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const planId = request.params.planId as string;
      const { month, subcategoryIds } = request.body || {};

      if (!isValidMonth(month)) {
        return returnJson(response, 400, { code: 400, message: "Invalid month. Expected YYYY-MM." });
      }
      if (!Array.isArray(subcategoryIds) || subcategoryIds.some((id) => typeof id !== "string")) {
        return returnJson(response, 400, { code: 400, message: "Invalid input: 'subcategoryIds' must be an array." });
      }

      const validData = validateAssignmentData(request.body, response);
      if (!validData) return;

      const plan = await PlanRepository.findByIdAndUserId(planId, userId);
      if (!plan) {
        return returnJson(response, 404, { code: 404, message: "Plan not found" });
      }

      // Restrict to subcategories the user owns in this plan.
      const owned = await SubcategoryAssignmentRepository.findOwnedWithAssignment(
        subcategoryIds,
        userId,
        planId,
        month,
      );
      const ownedIds = owned.map((sub) => sub.subcategoryId);

      const assignments = await SubcategoryAssignmentRepository.setAssignedMany(ownedIds, month, validData.assigned);
      return returnJson(response, 200, { month, assignments });
    } catch (error) {
      console.error("Error in bulkAssign:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans/:planId/assignments/cover-overspending
   * For each selected overspent subcategory, raise its assigned money for the month to the amount
   * spent, so its available balance becomes zero. Lines that are not overspent are left untouched.
   * Body: { month: "YYYY-MM", subcategoryIds: string[] }
   */
  export async function coverOverspending(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const planId = request.params.planId as string;
      const { month, subcategoryIds } = request.body || {};

      if (!isValidMonth(month)) {
        return returnJson(response, 400, { code: 400, message: "Invalid month. Expected YYYY-MM." });
      }
      if (!Array.isArray(subcategoryIds) || subcategoryIds.some((id) => typeof id !== "string")) {
        return returnJson(response, 400, { code: 400, message: "Invalid input: 'subcategoryIds' must be an array." });
      }

      const plan = await PlanRepository.findByIdAndUserId(planId, userId);
      if (!plan) {
        return returnJson(response, 404, { code: 404, message: "Plan not found" });
      }

      const owned = await SubcategoryAssignmentRepository.findOwnedWithAssignment(
        subcategoryIds,
        userId,
        planId,
        month,
      );

      const covered = [];
      for (const sub of owned) {
        const spent = parseFloat(sub.spent);
        const current = sub.assigned === null ? 0 : parseFloat(sub.assigned);
        if (spent <= current) continue; // not overspent: nothing to cover
        const saved = await SubcategoryAssignmentRepository.setAssigned(sub.subcategoryId, month, spent.toString());
        covered.push(saved);
      }

      return returnJson(response, 200, { month, covered });
    } catch (error) {
      console.error("Error in coverOverspending:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
