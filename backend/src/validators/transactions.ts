import { Response } from "express";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { CategoryRepository } from "../repositories/categoryRepository";
import { SubcategoryRepository } from "../repositories/subcategoryRepository";
import { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { PlanRepository } from "../repositories/planRepository";
import { TransactionRepository } from "../repositories/transactionRepository";
import { TagRepository } from "../repositories/tagRepository";
import { MAX_TAGS_PER_TRANSACTION } from "./tags";
import { isUuid } from "./uuid";

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Limits for the size of an amount in kronor. The sign is not part of the size: a minus means money out.
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1_000_000;

/**
 * Validates the optional list of tag ids on a transaction.
 * Returns undefined when it was left out (keep the current tags), the cleaned list otherwise,
 * or null if the response was already sent.
 */
async function validateTagIds(
  tagIds: unknown,
  userId: number,
  response: Response,
): Promise<string[] | undefined | null> {
  if (tagIds === undefined || tagIds === null) return undefined;

  if (!Array.isArray(tagIds) || tagIds.some((id) => !isUuid(id))) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'tagIds' must be a list of tag ids.",
    });
    return null;
  }

  const unique = [...new Set(tagIds as string[])];
  if (unique.length > MAX_TAGS_PER_TRANSACTION) {
    returnJson(response, 400, {
      code: 400,
      message: `Invalid input: a transaction can have at most ${MAX_TAGS_PER_TRANSACTION} tags.`,
    });
    return null;
  }

  if ((await TagRepository.countByIdsAndUserId(unique, userId)) !== unique.length) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'tagIds' contains a tag that does not exist.",
    });
    return null;
  }

  return unique;
}

/**
 * Validates the optional `repeatMonthly` of a new transaction: the day of the month it repeats on.
 * Only an expense with money out (a negative amount) can repeat.
 * Returns undefined when it was left out, the cleaned value otherwise, or null if the response was already sent.
 */
function validateRepeatMonthly(
  repeatMonthly: unknown,
  type: string,
  amount: number,
  response: Response,
): { dayOfMonth: number } | undefined | null {
  if (repeatMonthly === undefined || repeatMonthly === null) return undefined;

  const dayOfMonth = (repeatMonthly as { dayOfMonth?: unknown }).dayOfMonth;
  if (typeof dayOfMonth !== "number" || !Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'repeatMonthly.dayOfMonth' must be a whole number from 1 to 31.",
    });
    return null;
  }

  if (type !== "EXPENSE" || amount >= 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: only an expense with money out (a negative amount) can repeat monthly.",
    });
    return null;
  }

  return { dayOfMonth };
}

/**
 * Validates request data for transaction creation and updates
 */
export async function validateTransactionData(body: any, response: Response, userId: number) {
  const { amount, date, description, type, categoryId, subcategoryId, savingsGoalId } = body || {};

  // 1. Amount validation (must be a valid number)
  const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(parsedAmount) || !isFinite(parsedAmount)) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'amount' must be a valid number.",
    });
    return null;
  }

  // 1b. Size limits, whatever the sign
  if (Math.abs(parsedAmount) < MIN_AMOUNT || Math.abs(parsedAmount) > MAX_AMOUNT) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'amount' must be between 1 and 1000000 (a minus sign means money out).",
    });
    return null;
  }

  // 2. Date validation
  if (!date || typeof date !== "string" || !DATE_REGEX.test(date.trim())) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'date' is required in YYYY-MM-DD format.",
    });
    return null;
  }

  // 3. Type validation
  if (!type || (type !== "EXPENSE" && type !== "SAVING")) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'type' must be 'EXPENSE' or 'SAVING'.",
    });
    return null;
  }

  // 4. Amount rules per type:
  // - EXPENSE: can be positive or negative
  // - SAVING: MUST be positive (> 0)
  if (type === "SAVING" && parsedAmount <= 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'amount' for a SAVING transaction must be a positive number.",
    });
    return null;
  }

  // Normalized values
  const normCategory =
    categoryId && typeof categoryId === "string" && categoryId.trim() !== "" ? categoryId.trim() : null;
  const normSubcategory =
    subcategoryId && typeof subcategoryId === "string" && subcategoryId.trim() !== "" ? subcategoryId.trim() : null;
  const normSavingsGoal =
    savingsGoalId && typeof savingsGoalId === "string" && savingsGoalId.trim() !== "" ? savingsGoalId.trim() : null;

  // 5. Strict Type <-> Field cross-validation logic
  if (type === "EXPENSE") {
    if (normSavingsGoal !== null) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid transaction: An EXPENSE transaction cannot have a 'savingsGoalId'.",
      });
      return null;
    }

    if (normCategory === null || !isUuid(normCategory)) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid transaction: An EXPENSE transaction requires a valid 'categoryId'.",
      });
      return null;
    }

    // Verify category exists
    const categoryExists = await CategoryRepository.findCategoryById(normCategory);
    if (!categoryExists) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid transaction: 'categoryId' does not exist.",
      });
      return null;
    }

    // If subcategory is provided, verify it belongs to category
    if (normSubcategory !== null) {
      if (!isUuid(normSubcategory)) {
        returnJson(response, 400, {
          code: 400,
          message: "Invalid transaction: 'subcategoryId' must be a valid UUID.",
        });
        return null;
      }

      const isBelonging = await SubcategoryRepository.isSubcategoryOfCategory(normSubcategory, normCategory);
      if (!isBelonging) {
        returnJson(response, 400, {
          code: 400,
          message: "Invalid transaction: 'subcategoryId' does not belong to the specified 'categoryId'.",
        });
        return null;
      }
    }
  } else if (type === "SAVING") {
    if (normCategory !== null || normSubcategory !== null) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid transaction: A SAVING transaction cannot have a 'categoryId' or 'subcategoryId'.",
      });
      return null;
    }

    if (normSavingsGoal === null || !isUuid(normSavingsGoal)) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid transaction: A SAVING transaction requires a valid 'savingsGoalId'.",
      });
      return null;
    }

    // Verify savings goal exists
    const goalExists = await SavingsGoalRepository.findById(normSavingsGoal);
    if (!goalExists) {
      returnJson(response, 400, {
        code: 400,
        message: "Invalid transaction: 'savingsGoalId' does not exist.",
      });
      return null;
    }
  }

  // 6. Tags (optional)
  const normTagIds = await validateTagIds(body?.tagIds, userId, response);
  if (normTagIds === null) return null;

  // 7. Repeat monthly (optional, only when creating)
  const normRepeat = validateRepeatMonthly(body?.repeatMonthly, type, parsedAmount, response);
  if (normRepeat === null) return null;

  return {
    amount: parsedAmount.toFixed(2),
    date: date.trim(),
    description: typeof description === "string" ? description.trim() : null,
    type: type as "EXPENSE" | "SAVING",
    categoryId: normCategory,
    subcategoryId: normSubcategory,
    savingsGoalId: normSavingsGoal,
    tagIds: normTagIds,
    repeatMonthly: normRepeat,
  };
}
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

export async function validateExistingRequest(request: any, response: any) {
  if (!authorizeRequest(request, response)) return null;

  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  const id = request.params.id;
  if (!isUuid(id)) {
    returnJson(response, 404, { code: 404, message: "Transaction not found" });
    return null;
  }

  const existingTx = await TransactionRepository.findById(id);
  if (!existingTx) {
    returnJson(response, 404, { code: 404, message: "Transaction not found" });
    return null;
  }

  const plan = await PlanRepository.findByIdAndUserId(existingTx.budgetPlanId, userId);
  if (!plan) {
    returnJson(response, 404, { code: 404, message: "Transaction not found" });
    return null;
  }
  return id;
}
