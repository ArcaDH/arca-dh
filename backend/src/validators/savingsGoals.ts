import { Response } from "express";
import { returnJson } from "../services/apiService";
import { validatePlanScopedRequest } from "./planScope";
import { todayOf } from "../services/monthlyDates";

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const validateRequest = validatePlanScopedRequest;

// An optional field's value after parsing, or the message to answer with when it's invalid
type Parsed<T> = { value: T } | { error: string };

const isBlank = (value: unknown) => value === undefined || value === null || value === "";

// No deadline is fine; a given one must be a future "YYYY-MM-DD" date
function parseDeadline(deadline: unknown, today: string): Parsed<string | null> {
  if (isBlank(deadline)) return { value: null };
  if (typeof deadline !== "string" || !DATE_REGEX.test(deadline.trim())) {
    return { error: "Invalid input: 'deadline' must be in YYYY-MM-DD format." };
  }
  const date = deadline.trim();
  return date <= today ? { error: "Invalid input: 'deadline' must be a future date." } : { value: date };
}

// No monthly amount is fine; a given one must be a positive number
function parseMonthlyAmount(monthlyAmount: unknown): Parsed<number | null> {
  if (isBlank(monthlyAmount)) return { value: null };
  const amount = typeof monthlyAmount === "number" ? monthlyAmount : parseFloat(String(monthlyAmount));
  return isNaN(amount) || amount <= 0
    ? { error: "Invalid input: 'monthlyAmount' must be a positive number." }
    : { value: amount };
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

  const deadlineValue = parseDeadline(deadline, todayOf(new Date()));
  if ("error" in deadlineValue) {
    returnJson(response, 400, { code: 400, message: deadlineValue.error });
    return null;
  }

  const monthlyValue = parseMonthlyAmount(monthlyAmount);
  if ("error" in monthlyValue) {
    returnJson(response, 400, { code: 400, message: monthlyValue.error });
    return null;
  }

  return {
    name: name.trim(),
    targetAmount: parsedTarget,
    deadline: deadlineValue.value,
    monthlyAmount: monthlyValue.value,
  };
}
