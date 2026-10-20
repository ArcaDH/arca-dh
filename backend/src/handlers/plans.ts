import { Request, Response } from "express";
import { UserRepository } from "../repositories/userRepository";
import { PlanRepository } from "../repositories/planRepository";
import { authorizeRequest, userIdFromToken, returnCode, returnJson } from "../services/apiService";
import { isValidMonth, monthOf, todayOf } from "../services/monthlyDates";
import { PlanService } from "../services/planService";
import { isUuid } from "../validators/uuid";

const PAST_MONTH_MESSAGE =
  "Invalid input: 'month' cannot be in the past. It must be the current month or a future month.";

export namespace PlanHandler {
  /** GET /plans (?month=YYYY-MM) */
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
        if (!isValidMonth(queryMonth)) {
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

  /** POST /plans */
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

      const planMonth = PlanService.monthForNewPlan(monthInput, monthOf(todayOf(new Date())));
      if ("error" in planMonth) {
        return returnJson(response, 400, {
          code: 400,
          message:
            planMonth.error === "invalid"
              ? "Invalid input: 'month' must be in YYYY-MM format (e.g. 2026-10)."
              : PAST_MONTH_MESSAGE,
        });
      }

      const user = await UserRepository.findById(userId);

      if (!user) {
        returnCode(response, 404);
        return;
      }

      const { plan: newPlan, current } = await PlanService.createPlanForUser(user, name.trim(), planMonth.month);

      return returnJson(response, 201, {
        id: newPlan.id,
        name: newPlan.name,
        month: newPlan.month,
        current,
      });
    } catch (error) {
      console.error("Error in createPlan:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** GET /plans/current */
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

  /** PUT /plans/current */
  export async function setCurrentPlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.body?.planId;
      if (!isUuid(planId)) {
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

  /** GET /plans/:planId */
  export async function getPlanById(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.params.planId;
      if (!isUuid(planId)) {
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

  /** PUT /plans/:planId */
  export async function updatePlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.params.planId;
      if (!isUuid(planId)) {
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

      const planMonth = PlanService.monthForUpdatedPlan(monthInput, plan.month, monthOf(todayOf(new Date())));
      if ("error" in planMonth) {
        return returnJson(response, 400, {
          code: 400,
          message:
            planMonth.error === "invalid" ? "Invalid input: 'month' must be in YYYY-MM format." : PAST_MONTH_MESSAGE,
        });
      }
      const updatedMonth = planMonth.month;

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

  /** DELETE /plans/:planId */
  export async function deletePlan(request: Request, response: Response) {
    try {
      if (!authorizeRequest(request, response)) return;

      const userId = userIdFromToken(request);
      if (!userId) {
        returnCode(response, 401);
        return;
      }

      const planId = request.params.planId;
      if (!isUuid(planId)) {
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

      await PlanService.deletePlanForUser(user, planId);

      response.status(204).send();
    } catch (error) {
      console.error("Error in deletePlan:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
