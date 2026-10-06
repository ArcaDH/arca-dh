import { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { User, budgetPlans } from "../db/schema";
import { authorizeRequest, userIdFromToken, returnCode, returnJson } from "../services/apiService";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export namespace PlanHandler {
  /**
   * GET /plans
   * List budget plans for the logged-in user
   */
  export async function getPlans(request: Request, response: Response) {
    if (!authorizeRequest(request, response)) return;

    const userId = userIdFromToken(request);
    if (!userId) {
      returnCode(response, 401);
      return;
    }

    const user = await db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      returnCode(response, 404);
      return;
    }

    const plans = await db
      .select()
      .from(budgetPlans)
      .where(eq(budgetPlans.userId, userId));

    const result = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      month: plan.month,
      current: user.currentPlanId === plan.id,
    }));

    return returnJson(response, 200, result);
  }

  /**
   * POST /plans
   * Create a budget plan
   */
  export async function createPlan(request: Request, response: Response) {
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

    const user = await db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      returnCode(response, 404);
      return;
    }

    const [newPlan] = await db
      .insert(budgetPlans)
      .values({
        name: name.trim(),
        month: planMonth,
        userId: userId,
      })
      .returning();

    let isCurrent = false;
    if (!user.currentPlanId) {
      await db
        .update(User)
        .set({ currentPlanId: newPlan.id })
        .where(eq(User.userId, userId));
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
  }

  /**
   * GET /plans/current
   * Get my current (default) plan
   */
  export async function getCurrentPlan(request: Request, response: Response) {
    if (!authorizeRequest(request, response)) return;

    const userId = userIdFromToken(request);
    if (!userId) {
      returnCode(response, 401);
      return;
    }

    const user = await db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user || !user.currentPlanId) {
      return returnJson(response, 404, {
        code: 404,
        message: "No current plan selected yet",
      });
    }

    const plan = await db
      .select()
      .from(budgetPlans)
      .where(and(eq(budgetPlans.id, user.currentPlanId), eq(budgetPlans.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);

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
  }

  /**
   * PUT /plans/current
   * Select my current (default) plan
   */
  export async function setCurrentPlan(request: Request, response: Response) {
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

    const plan = await db
      .select()
      .from(budgetPlans)
      .where(and(eq(budgetPlans.id, planId), eq(budgetPlans.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!plan) {
      return returnJson(response, 404, {
        code: 404,
        message: "Plan not found",
      });
    }

    await db
      .update(User)
      .set({ currentPlanId: plan.id })
      .where(eq(User.userId, userId));

    return returnJson(response, 200, {
      id: plan.id,
      name: plan.name,
      month: plan.month,
      current: true,
    });
  }

  /**
   * GET /plans/:planId
   * Get a plan by ID
   */
  export async function getPlanById(request: Request, response: Response) {
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

    const user = await db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      returnCode(response, 404);
      return;
    }

    const plan = await db
      .select()
      .from(budgetPlans)
      .where(and(eq(budgetPlans.id, planId), eq(budgetPlans.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);

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
  }

  /**
   * PUT /plans/:planId
   * Update a plan by ID
   */
  export async function updatePlan(request: Request, response: Response) {
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

    const user = await db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      returnCode(response, 404);
      return;
    }

    const plan = await db
      .select()
      .from(budgetPlans)
      .where(and(eq(budgetPlans.id, planId), eq(budgetPlans.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);

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

    await db
      .update(budgetPlans)
      .set({ name: name.trim(), month: updatedMonth })
      .where(eq(budgetPlans.id, planId));

    return returnJson(response, 200, {
      id: plan.id,
      name: name.trim(),
      month: updatedMonth,
      current: user.currentPlanId === plan.id,
    });
  }

  /**
   * DELETE /plans/:planId
   * Delete a plan by ID
   */
  export async function deletePlan(request: Request, response: Response) {
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

    const user = await db
      .select()
      .from(User)
      .where(eq(User.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      returnCode(response, 404);
      return;
    }

    const plan = await db
      .select()
      .from(budgetPlans)
      .where(and(eq(budgetPlans.id, planId), eq(budgetPlans.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!plan) {
      return returnJson(response, 404, {
        code: 404,
        message: "Plan not found",
      });
    }

    if (user.currentPlanId === planId) {
      await db
        .update(User)
        .set({ currentPlanId: null })
        .where(eq(User.userId, userId));
    }

    await db
      .delete(budgetPlans)
      .where(eq(budgetPlans.id, planId));

    response.status(204).send();
  }
}
