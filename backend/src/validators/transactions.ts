import { Response } from "express";
import { authorizeRequest, returnCode, returnJson, userIdFromToken } from "../services/apiService";
import { CategoryRepository } from "../repositories/categoryRepository";
import { SubcategoryRepository } from "../repositories/subcategoryRepository";
import { SavingsGoalRepository } from "../repositories/savingsGoalRepository";
import { PlanRepository } from "../repositories/planRepository";
import { TransactionRepository } from "../repositories/transactionRepository";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Validates request data for transaction creation and updates
 */
export async function validateTransactionData(body: any, response: Response) {
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

    if (normCategory === null || !UUID_REGEX.test(normCategory)) {
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
      if (!UUID_REGEX.test(normSubcategory)) {
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

    if (normSavingsGoal === null || !UUID_REGEX.test(normSavingsGoal)) {
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

  return {
    amount: parsedAmount.toFixed(2),
    date: date.trim(),
    description: typeof description === "string" ? description.trim() : null,
    type: type as "EXPENSE" | "SAVING",
    categoryId: normCategory,
    subcategoryId: normSubcategory,
    savingsGoalId: normSavingsGoal,
  };
}
export async function validateRequest(request: any, response: any) {
  if (!authorizeRequest(request, response)) returnCode(response, 401);

  const userId = userIdFromToken(request);
  if (!userId) {
    returnCode(response, 401);
    return null;
  }

  const planId = request.params.planId;
  if (typeof planId !== "string" || !UUID_REGEX.test(planId)) {
    returnJson(response, 404, { code: 404, message: "Plan not found" });
  }

  const plan = await PlanRepository.findByIdAndUserId(planId, userId);
  if (!plan) {
    returnJson(response, 404, { code: 404, message: "Plan not found" });
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
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
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
