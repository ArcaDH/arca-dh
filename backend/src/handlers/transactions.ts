import { Request, Response } from "express";
import { TransactionRepository } from "../repositories/transactionRepository";
import { validateExistingRequest, validateRequest, validateTransactionData } from "../validators/transactions";
import { returnJson, userIdFromToken } from "../services/apiService";
import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { MonthlyPaymentService } from "../services/monthlyPaymentService";
import { handledThroughFor, isValidMonth, monthOf, todayOf } from "../services/monthlyDates";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

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

      if (queryMonth && !isValidMonth(queryMonth)) {
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

      // The monthly payments that are due get their transactions first, so the list is complete
      await MonthlyPaymentService.ensureGenerated(planId);

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

      const validData = await validateTransactionData(request.body, response, userIdFromToken(request) as number);
      if (!validData) return;

      const { tagIds, repeatMonthly, ...fields } = validData;

      if (repeatMonthly) {
        // A repeating expense: the payment and the transaction the user logged are created together
        const transactionId = await MonthlyPaymentRepository.createWithTransaction(
          {
            budgetPlanId: planId,
            amount: fields.amount,
            description: fields.description,
            dayOfMonth: repeatMonthly.dayOfMonth,
            generatedThrough: handledThroughFor(fields.date, todayOf(new Date()), repeatMonthly.dayOfMonth),
            // An expense always has a category, the validator makes sure of it
            categoryId: fields.categoryId as string,
            subcategoryId: fields.subcategoryId,
          },
          { ...fields, budgetPlanId: planId },
          tagIds ?? [],
          monthOf(fields.date),
        );
        return returnJson(response, 201, await TransactionRepository.findFormattedById(transactionId));
      }

      const newTx = await TransactionRepository.createTransaction({ ...fields, budgetPlanId: planId }, tagIds);

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

      const validData = await validateTransactionData(request.body, response, userIdFromToken(request) as number);
      if (!validData) return;

      const { tagIds, repeatMonthly, ...fields } = validData;
      if (repeatMonthly) {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid input: 'repeatMonthly' can only be set when a transaction is created.",
        });
      }

      const updatedTx = await TransactionRepository.updateTransaction(id, fields, tagIds);
      return returnJson(response, 200, updatedTx);
    } catch (error) {
      console.error("Error in updateTransaction:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /**
   * DELETE /transactions/:id
   * Delete a transaction by ID. With ?stopRepeating=true, a transaction made by a monthly payment also stops it.
   */
  export async function deleteTransaction(request: Request, response: Response) {
    try {
      const id = await validateExistingRequest(request, response);
      if (id == null) return;

      const stopRepeating = request.query.stopRepeating as string | undefined;
      if (stopRepeating !== undefined && stopRepeating !== "true" && stopRepeating !== "false") {
        return returnJson(response, 400, {
          code: 400,
          message: "Invalid query parameter: 'stopRepeating' must be true or false.",
        });
      }

      const existing = stopRepeating === "true" ? await TransactionRepository.findById(id) : undefined;

      // Stopping the payment is done in the same database transaction as the delete, so it can't half happen
      if (existing?.monthlyPaymentId) await TransactionRepository.deleteTransaction(id, existing.monthlyPaymentId);
      else await TransactionRepository.deleteTransaction(id);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteTransaction:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
