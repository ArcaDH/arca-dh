import { Response } from "express";
import { CategoryRepository } from "../repositories/categoryRepository";
import { SubcategoryRepository } from "../repositories/subcategoryRepository";
import { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { TransactionRepository } from "../repositories/transactionRepository";
import { TagRepository } from "../repositories/tagRepository";
import { MAX_TAGS_PER_TRANSACTION } from "./tags";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { PlanRepository } from "../repositories/planRepository";
import { isUuid } from "./uuid";
import { validatePlanScopedRequest } from "./planScope";

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Amount limits in SEK (absolute value)
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1_000_000;

/** Validate optional tag UUID list and user ownership. */
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

/** Validate repeatMonthly parameter for recurring expenses. */
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

/** Validate request data for transaction creation and update. */
export async function validateTransactionData(body: any, response: Response, userId: number) {
  const { amount, date, description, type, categoryId, subcategoryId, savingsGoalId } = body || {};

  // Amount validation
  const parsedAmount = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(parsedAmount) || !isFinite(parsedAmount)) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'amount' must be a valid number.",
    });
    return null;
  }

  // Amount range limit
  if (Math.abs(parsedAmount) < MIN_AMOUNT || Math.abs(parsedAmount) > MAX_AMOUNT) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'amount' must be between 1 and 1000000 (a minus sign means money out).",
    });
    return null;
  }

  // Date validation
  if (!date || typeof date !== "string" || !DATE_REGEX.test(date.trim())) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'date' is required in YYYY-MM-DD format.",
    });
    return null;
  }

  // Type validation
  if (!type || (type !== "EXPENSE" && type !== "SAVING")) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'type' must be 'EXPENSE' or 'SAVING'.",
    });
    return null;
  }

  // Savings must be positive
  if (type === "SAVING" && parsedAmount <= 0) {
    returnJson(response, 400, {
      code: 400,
      message: "Invalid input: 'amount' for a SAVING transaction must be a positive number.",
    });
    return null;
  }

  const normCategory =
    categoryId && typeof categoryId === "string" && categoryId.trim() !== "" ? categoryId.trim() : null;
  const normSubcategory =
    subcategoryId && typeof subcategoryId === "string" && subcategoryId.trim() !== "" ? subcategoryId.trim() : null;
  const normSavingsGoal =
    savingsGoalId && typeof savingsGoalId === "string" && savingsGoalId.trim() !== "" ? savingsGoalId.trim() : null;

  // Cross-validation by transaction type
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

    // Verify subcategory belongs to category
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

  // Optional tags
  const normTagIds = await validateTagIds(body?.tagIds, userId, response);
  if (normTagIds === null) return null;

  // Optional monthly repetition
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
export const validateRequest = validatePlanScopedRequest;

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
