import { Request, Response } from "express";
import { UserRepository } from "../repositories/userRepository";
import { PlanRepository } from "../repositories/planRepository";
import { authorizeRequest, userIdFromToken, returnCode, returnJson } from "../services/apiService";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export namespace PlanHandler {
  /**
   * GET /plans
   * List budget plans for the logged-in user
   */
  export async function getPlans(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const plans = await PlanRepository.findByUserId(userId);

      const result = plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        current: user.currentPlanId === plan.id,
      }));

      return returnJson(response, 200, result);
    } catch (error) {
      console.error("Error in getPlans:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans
   * Create a budget plan
   */
  export async function createPlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const name = request.body?.name;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid input: 'name' is required.",
        });
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const newPlan = await PlanRepository.createPlan({
        name: name.trim(),
        userId: userId,
      });

      let isCurrent = false;
      if (!user.currentPlanId) {
        await UserRepository.updateCurrentPlanId(userId, newPlan.id);
        isCurrent = true;
      } else {
        isCurrent = user.currentPlanId === newPlan.id;
      }

      return returnJson(response, 201, {
        id: newPlan.id,
        name: newPlan.name,
        current: isCurrent,
      });
    } catch (error) {
      console.error("Error in createPlan:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * GET /plans/current
   * Get my current (default) plan
   */
  export async function getCurrentPlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const user = await UserRepository.findById(userId);

      if (!user || !user.currentPlanId) {
        return returnJson(response, 404, {
          code: 404,
          message: "No current plan selected yet",
        });
      }

      const plan = await PlanRepository.findByIdAndUserId(user.currentPlanId, userId);

      if (!plan) {
        return returnJson(response, 404, {
          code: 404,
          message: "No current plan selected yet",
        });
      }

      return returnJson(response, 200, {
        id: plan.id,
        name: plan.name,
        current: true,
      });
    } catch (error) {
      console.error("Error in getCurrentPlan:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /plans/current
   * Select my current (default) plan
   */
  export async function setCurrentPlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.body?.planId;
      if (typeof planId !== "string" || !UUID_REGEX.test(planId)) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      const plan = await PlanRepository.findByIdAndUserId(planId, userId);

      if (!plan) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      await UserRepository.updateCurrentPlanId(userId, plan.id);

      return returnJson(response, 200, {
        id: plan.id,
        name: plan.name,
        current: true,
      });
    } catch (error) {
      console.error("Error in setCurrentPlan:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * GET /plans/:planId
   * Get a plan by ID
   */
  export async function getPlanById(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.params.planId;
      if (typeof planId !== "string" || !UUID_REGEX.test(planId)) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const plan = await PlanRepository.findByIdAndUserId(planId, userId);

      if (!plan) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      return returnJson(response, 200, {
        id: plan.id,
        name: plan.name,
        current: user.currentPlanId === plan.id,
      });
    } catch (error) {
      console.error("Error in getPlanById:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /plans/:planId
   * Update a plan by ID
   */
  export async function updatePlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.params.planId;
      if (typeof planId !== "string" || !UUID_REGEX.test(planId)) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      const name = request.body?.name;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid input: 'name' is required.",
        });
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const plan = await PlanRepository.findByIdAndUserId(planId, userId);

      if (!plan) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      await PlanRepository.updatePlan(planId, { name: name.trim() });

      return returnJson(response, 200, {
        id: plan.id,
        name: name.trim(),
        current: user.currentPlanId === plan.id,
      });
    } catch (error) {
      console.error("Error in updatePlan:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * DELETE /plans/:planId
   * Delete a plan by ID
   */
  export async function deletePlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.params.planId;
      if (typeof planId !== "string" || !UUID_REGEX.test(planId)) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const plan = await PlanRepository.findByIdAndUserId(planId, userId);

      if (!plan) {
        return returnJson(response, 404, {
          code: 404,
          message: "Plan not found",
        });
      }

      if (user.currentPlanId === planId) {
        await UserRepository.updateCurrentPlanId(userId, null);
      }

      await PlanRepository.deletePlan(planId);

      response.status(204).send();
    } catch (error) {
      console.error("Error in deletePlan:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
