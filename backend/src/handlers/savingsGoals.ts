import { Request, Response } from "express";
import { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { returnJson } from "../services/apiService";
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
}
