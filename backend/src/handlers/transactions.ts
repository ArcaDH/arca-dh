import { Request, Response } from "express";
import { TransactionRepository } from "../repositories/transactionRepository";
import { validateExistingRequest, validateRequest, validateTransactionData } from "../validators/transactions";
import { returnJson } from "../services/apiService";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export namespace TransactionHandler {
  /**
   * GET /plans/:planId/transactions
   * List transactions of a plan (sorted by date, newest first).
   * Optional query filters: ?month=YYYY-MM & ?categoryId=UUID & ?type=EXPENSE|SAVING
   */
  export async function getTransactions(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const queryMonth = request.query.month as string | undefined;
      const queryCategory = request.query.categoryId as string | undefined;
      const queryType = request.query.type as "EXPENSE" | "SAVING" | undefined;

      if (queryMonth && !MONTH_REGEX.test(queryMonth.trim())) {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid query parameter: 'month' must be in YYYY-MM format.",
        });
      }

      if (queryCategory && !UUID_REGEX.test(queryCategory.trim())) {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid query parameter: 'categoryId' must be a valid UUID.",
        });
      }

      if (queryType && queryType !== "EXPENSE" && queryType !== "SAVING") {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid query parameter: 'type' must be EXPENSE or SAVING.",
        });
      }

      const filters = {
        month: queryMonth?.trim(),
        categoryId: queryCategory?.trim(),
        type: queryType,
      };

      const result = await TransactionRepository.findByPlanId(planId, filters);
      return returnJson(response, 200, result);
    } catch (error) {
      console.error("Error in getTransactions:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * POST /plans/:planId/transactions
   * Create a transaction for a plan
   */
  export async function createTransaction(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const validData = await validateTransactionData(request.body, response);
      if (!validData) return;

      const newTx = await TransactionRepository.createTransaction({
        ...validData,
        budgetPlanId: planId,
      });

      return returnJson(response, 201, newTx);
    } catch (error) {
      console.error("Error in createTransaction:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * PUT /transactions/:id
   * Update a transaction by ID
   */
  export async function updateTransaction(request: Request, response: Response) {
    try {
      const id = await validateExistingRequest(request, response);
      if (id == null) return;

      const validData = await validateTransactionData(request.body, response);
      if (!validData) return;

      const updatedTx = await TransactionRepository.updateTransaction(id, validData);
      return returnJson(response, 200, updatedTx);
    } catch (error) {
      console.error("Error in updateTransaction:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * DELETE /transactions/:id
   * Delete a transaction by ID
   */
  export async function deleteTransaction(request: Request, response: Response) {
    try {
      const id = await validateExistingRequest(request, response);
      if (id == null) return;

      await TransactionRepository.deleteTransaction(id);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteTransaction:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
