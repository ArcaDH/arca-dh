import { Response } from "express";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { PlanRepository } from "../repositories/planRepository";
import { isUuid } from "./uuid";

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export async function validateRequest(request: any, response: any) {
  if (!authorizeRequest(request, response)) return null;

  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  const planId = request.params.planId;
  if (!isUuid(planId)) {
    returnJson(response, 404, { code: 404, message: "Plan not found" });
    return null;
  }

  const plan = await PlanRepository.findByIdAndUserId(planId, userId);
  if (!plan) {
    returnJson(response, 404, { code: 404, message: "Plan not found" });
    return null;
  }
  return planId;
}

/**
 * Validates request data for savings goal creation
 */
export function validateSavingsGoalData(body: any, response: Response) {
  const { name, targetAmount, deadline, monthlyAmount } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'name' is required.",
    });
    return null;
  }

  const parsedTarget = typeof targetAmount === "number" ? targetAmount : parseFloat(targetAmount);
  if (isNaN(parsedTarget) || parsedTarget <= 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'targetAmount' must be a positive number.",
    });
    return null;
  }

  let deadlineValue: string | null = null;
  if (deadline !== undefined && deadline !== null && deadline !== "") {
    if (typeof deadline !== "string" || !DATE_REGEX.test(deadline.trim())) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid input: 'deadline' must be in YYYY-MM-DD format.",
      });
      return null;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const deadlineStr = deadline.trim();

    if (deadlineStr <= todayStr) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid input: 'deadline' must be a future date.",
      });
      return null;
    }

    deadlineValue = deadlineStr;
  }

  let monthlyValue: number | null = null;
  if (monthlyAmount !== undefined && monthlyAmount !== null && monthlyAmount !== "") {
    const parsedMonthly = typeof monthlyAmount === "number" ? monthlyAmount : parseFloat(monthlyAmount);
    if (isNaN(parsedMonthly) || parsedMonthly <= 0) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid input: 'monthlyAmount' must be a positive number.",
      });
      return null;
    }
    monthlyValue = parsedMonthly;
  }

  return {
    name: name.trim(),
    targetAmount: parsedTarget,
    deadline: deadlineValue,
    monthlyAmount: monthlyValue,
  };
}
