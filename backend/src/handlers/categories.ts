import { Request, Response } from "express";
import { CategoryRepository } from "../repositories/categoryRepository";
import { returnJson, returnCode, authorizeRequest, userIdFromToken } from "../services/apiService";
import { validateRequest, validateCategoryData } from "../validators/categories";

export namespace CategoryHandler {
  /**
   * GET /plans/:planId/categories
   * List categories of a plan
   */
  export async function getCategories(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const result = await CategoryRepository.findCategoriesByPlanId(planId);
      return returnJson(response, 200, result);
    } catch (error) {
      console.error("Error in getCategories:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans/:planId/categories
   * Create a category
   */
  export async function createCategory(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const validData = validateCategoryData(request.body, response);
      if (!validData) return;

      const created = await CategoryRepository.createCategory({
        name: validData.name,
        maxBudget: validData.maxBudget,
        budgetPlanId: planId,
      });

      return returnJson(response, 201, created);
    } catch (error) {
      console.error("Error in createCategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /categories/:id
   * Update a category
   */
  export async function updateCategory(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const categoryId = request.params.id as string;
      const existing = await CategoryRepository.findCategoryByIdAndUserId(categoryId, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Category not found" });
      }

      const validData = validateCategoryData(request.body, response);
      if (!validData) return;

      const updated = await CategoryRepository.updateCategory(categoryId, {
        name: validData.name,
        maxBudget: validData.maxBudget,
      });

      return returnJson(response, 200, updated);
    } catch (error) {
      console.error("Error in updateCategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * DELETE /categories/:id
   * Delete a category
   */
  export async function deleteCategory(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const categoryId = request.params.id as string;
      const existing = await CategoryRepository.findCategoryByIdAndUserId(categoryId, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Category not found" });
      }

      await CategoryRepository.deleteCategory(categoryId);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteCategory:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
