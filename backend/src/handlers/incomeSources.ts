import { Request, Response } from "express";
import { IncomeSourceRepository } from "../repositories/incomeSourceRepository";
import { returnJson, returnCode, authorizeRequest, userIdFromToken } from "../services/apiService";
import { validateRequest, validateIncomeSourceData } from "../validators/incomeSources";

export namespace IncomeSourceHandler {
  /**
   * GET /plans/:planId/income-sources
   * List income sources of a plan
   */
  export async function getIncomeSources(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const sources = await IncomeSourceRepository.findByPlanId(planId);
      return returnJson(response, 200, sources);
    } catch (error) {
      console.error("Error in getIncomeSources:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans/:planId/income-sources
   * Add an income source
   */
  export async function createIncomeSource(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const validData = validateIncomeSourceData(request.body, response);
      if (!validData) return;

      const created = await IncomeSourceRepository.createIncomeSource({
        name: validData.name,
        monthlyAmount: validData.monthlyAmount,
        budgetPlanId: planId,
      });

      return returnJson(response, 201, created);
    } catch (error) {
      console.error("Error in createIncomeSource:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /income-sources/:id
   * Update an income source
   */
  export async function updateIncomeSource(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const id = request.params.id as string;
      const existing = await IncomeSourceRepository.findByIdAndUserId(id, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Income source not found" });
      }

      const validData = validateIncomeSourceData(request.body, response);
      if (!validData) return;

      const updated = await IncomeSourceRepository.updateIncomeSource(id, {
        name: validData.name,
        monthlyAmount: validData.monthlyAmount,
      });

      return returnJson(response, 200, updated);
    } catch (error) {
      console.error("Error in updateIncomeSource:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * DELETE /income-sources/:id
   * Delete an income source
   */
  export async function deleteIncomeSource(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const id = request.params.id as string;
      const existing = await IncomeSourceRepository.findByIdAndUserId(id, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Income source not found" });
      }

      await IncomeSourceRepository.deleteIncomeSource(id);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteIncomeSource:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
