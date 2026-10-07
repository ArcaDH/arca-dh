import { Request, Response } from "express";
import { SubcategoryRepository } from "../repositories/subcategoryRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { returnJson, returnCode, authorizeRequest, userIdFromToken } from "../services/apiService";
import { validateSubcategoryData } from "../validators/subcategories";

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
        limit: validData.limit,
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
        limit: validData.limit,
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
}
