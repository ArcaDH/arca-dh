import { Request, Response } from "express";
import { SubcategoryRepository } from "../repositories/subcategoryRepository";
import { SubcategoryAssignmentRepository } from "../repositories/subcategoryAssignmentRepository";
import { SubcategoryAssignmentService } from "../services/subcategoryAssignmentService";
import { CategoryRepository } from "../repositories/categoryRepository";
import { PlanRepository } from "../repositories/planRepository";
import { returnJson, returnCode, authorizeRequest, userIdFromToken } from "../services/apiService";
import { isUniqueViolation } from "../services/dbErrors";
import { validateSubcategoryData, validateAssignmentData } from "../validators/subcategories";
import { isValidMonth } from "../services/monthlyDates";

const duplicateName = (response: Response) =>
  returnJson(response, 409, { code: 409, message: "This category already has a subcategory with that name." });

// Shared validation context for bulk assignment endpoints
async function resolveBulkRequest(
  request: Request,
  response: Response,
): Promise<{ userId: number; planId: string; month: string; subcategoryIds: string[] } | null> {
  if (!authorizeRequest(request, response)) return null;
  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  const planId = request.params.planId as string;
  const { month, subcategoryIds } = request.body || {};

  if (!isValidMonth(month)) {
    returnJson(response, 400, { code: 400, message: "Invalid month. Expected YYYY-MM." });
    return null;
  }
  if (!Array.isArray(subcategoryIds) || subcategoryIds.some((id) => typeof id !== "string")) {
    returnJson(response, 400, { code: 400, message: "Invalid input: 'subcategoryIds' must be an array." });
    return null;
  }

  const plan = await PlanRepository.findByIdAndUserId(planId, userId);
  if (!plan) {
    returnJson(response, 404, { code: 404, message: "Plan not found" });
    return null;
  }

  return { userId, planId, month, subcategoryIds };
}

export namespace SubcategoryHandler {
  /** GET /categories/:id/subcategories */
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

  /** POST /categories/:id/subcategories */
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
      if (isUniqueViolation(error)) return duplicateName(response);
      console.error("Error in createSubcategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** PUT /subcategories/:id */
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
      if (isUniqueViolation(error)) return duplicateName(response);
      console.error("Error in updateSubcategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** DELETE /subcategories/:id */
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

  /** PUT /subcategories/:id/assignments/:month */
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

  /** POST /plans/:planId/assignments/fund-targets - Top up assigned amounts to meet targets */
  export async function fundTargets(request: Request, response: Response) {
    try {
      const ctx = await resolveBulkRequest(request, response);
      if (!ctx) return;

      const funded = await SubcategoryAssignmentService.fundTargets(
        ctx.subcategoryIds,
        ctx.userId,
        ctx.planId,
        ctx.month,
      );
      return returnJson(response, 200, { month: ctx.month, funded });
    } catch (error) {
      console.error("Error in fundTargets:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** POST /plans/:planId/assignments/bulk - Assign amount to multiple subcategories */
  export async function bulkAssign(request: Request, response: Response) {
    try {
      const ctx = await resolveBulkRequest(request, response);
      if (!ctx) return;

      const validData = validateAssignmentData(request.body, response);
      if (!validData) return;

      const assignments = await SubcategoryAssignmentService.assignToEach(
        ctx.subcategoryIds,
        ctx.userId,
        ctx.planId,
        ctx.month,
        validData.assigned,
      );
      return returnJson(response, 200, { month: ctx.month, assignments });
    } catch (error) {
      console.error("Error in bulkAssign:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** POST /plans/:planId/assignments/cover-overspending - Raise assigned to spent for overspent subcategories */
  export async function coverOverspending(request: Request, response: Response) {
    try {
      const ctx = await resolveBulkRequest(request, response);
      if (!ctx) return;

      const covered = await SubcategoryAssignmentService.coverOverspending(
        ctx.subcategoryIds,
        ctx.userId,
        ctx.planId,
        ctx.month,
      );
      return returnJson(response, 200, { month: ctx.month, covered });
    } catch (error) {
      console.error("Error in coverOverspending:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
