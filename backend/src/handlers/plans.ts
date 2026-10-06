import { Request, Response } from "express";
import { UserRepository } from "../repositories/userRepository";
import { PlanRepository } from "../repositories/planRepository";
import { authorizeRequest, userIdFromToken, returnCode, returnJson } from "../services/apiService";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export namespace PlanHandler {
  /**
   * GET /plans
   * List budget plans for the logged-in user (optional query parameter: ?month=YYYY-MM)
   */
  export async function getPlans(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const queryMonth = request.query.month;
      if (queryMonth !== undefined && queryMonth !== null && queryMonth !== "") {
        if (typeof queryMonth !== "string" || !MONTH_REGEX.test(queryMonth.trim())) {
          return returnJson(response, 400, {
            code: 400,
            message: "Invalid query parameter: 'month' must be in YYYY-MM format.",
          });
        }
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const filterMonth = typeof queryMonth === "string" && queryMonth.trim() !== "" ? queryMonth.trim() : undefined;
      const plans = await PlanRepository.findByUserId(userId, filterMonth);

      const result = plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        month: plan.month,
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
      const monthInput = request.body?.month;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid input: 'name' is required.",
        });
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      let planMonth: string;

      if (monthInput === null || monthInput === undefined || (typeof monthInput === "string" && monthInput.trim() === "")) {
        planMonth = currentMonth;
      } else {
        if (typeof monthInput !== "string" || !MONTH_REGEX.test(monthInput.trim())) {
          return returnJson(response, 400, {
            code: 400,
            message: "Invalid input: 'month' must be in YYYY-MM format (e.g. 2026-10).",
          });
        }

        planMonth = monthInput.trim();

        if (planMonth < currentMonth) {
          return returnJson(response, 400, {
            code: 400,
            message: "Invalid input: 'month' cannot be in the past. It must be the current month or a future month.",
          });
        }
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const newPlan = await PlanRepository.createPlan({
        name: name.trim(),
        month: planMonth,
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
        month: newPlan.month,
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
        month: plan.month,
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
        month: plan.month,
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
        month: plan.month,
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
      const monthInput = request.body?.month;

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

      let updatedMonth = plan.month;
      if (monthInput !== undefined && monthInput !== null && monthInput !== "") {
        if (typeof monthInput !== "string" || !MONTH_REGEX.test(monthInput.trim())) {
          return returnJson(response, 400, {
            code: 400,
            message: "Invalid input: 'month' must be in YYYY-MM format.",
          });
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        const newMonth = monthInput.trim();
        if (newMonth < currentMonth) {
          return returnJson(response, 400, {
            code: 400,
            message: "Invalid input: 'month' cannot be in the past. It must be the current month or a future month.",
          });
        }
        updatedMonth = newMonth;
      }

      await PlanRepository.updatePlan(planId, { name: name.trim(), month: updatedMonth });

      return returnJson(response, 200, {
        id: plan.id,
        name: name.trim(),
        month: updatedMonth,
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
