import { Request, Response } from "express";
import { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { returnJson } from "../services/apiService";
import { authorizeRequest, returnCode, userIdFromToken } from "../services/apiService";
import { validateRequest, validateSavingsGoalData } from "../validators/savingsGoals";

export namespace SavingsGoalHandler {
  /**
   * GET /plans/:planId/goals
   * List savings goals for a budget plan with progress calculation
   */
  export async function getGoals(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const goals = await SavingsGoalRepository.findByPlanId(planId);
      return returnJson(response, 200, goals);
    } catch (error) {
      console.error("Error in getGoals:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans/:planId/goals
   * Create a savings goal for a budget plan
   */
  export async function createGoal(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const validData = validateSavingsGoalData(request.body, response);
      if (!validData) return;

      const newGoal = await SavingsGoalRepository.createGoal({
        name: validData.name,
        targetAmount: validData.targetAmount.toString(),
        deadline: validData.deadline,
        budgetPlanId: planId,
      });

      return returnJson(response, 201, newGoal);
    } catch (error) {
      console.error("Error in createGoal:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * GET /goals/:id
   * Get a single savings goal by ID
   */
  export async function getGoalById(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const goalId = request.params.id as string;
      const goal = await SavingsGoalRepository.findByIdAndUserId(goalId, userId);
      if (!goal) {
        return returnJson(response, 404, { code: 404, message: "Savings goal not found" });
      }

      return returnJson(response, 200, await SavingsGoalRepository.getGoalWithProgress(goal));
    } catch (error) {
      console.error("Error in getGoalById:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /goals/:id
   * Update a savings goal
   */
  export async function updateGoal(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const goalId = request.params.id as string;
      const existing = await SavingsGoalRepository.findByIdAndUserId(goalId, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Savings goal not found" });
      }

      const validData = validateSavingsGoalData(request.body, response);
      if (!validData) return;

      const updated = await SavingsGoalRepository.updateGoal(goalId, {
        name: validData.name,
        targetAmount: validData.targetAmount.toString(),
        deadline: validData.deadline,
      });

      return returnJson(response, 200, updated);
    } catch (error) {
      console.error("Error in updateGoal:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * DELETE /goals/:id
   * Delete a savings goal
   */
  export async function deleteGoal(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;
      const userId = userIdFromToken(request);
      if (!userId) return returnCode(response, 401);

      const goalId = request.params.id as string;
      const existing = await SavingsGoalRepository.findByIdAndUserId(goalId, userId);
      if (!existing) {
        return returnJson(response, 404, { code: 404, message: "Savings goal not found" });
      }

      await SavingsGoalRepository.deleteGoal(goalId);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteGoal:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
