import { Request, Response } from "express";
import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { MonthlyPaymentService } from "../services/monthlyPaymentService";
import { returnJson } from "../services/apiService";
import { validateExistingRequest, validateRequest } from "../validators/monthlyPayments";

export namespace MonthlyPaymentHandler {
  /** GET /plans/:planId/monthly-payments */
  export async function getMonthlyPayments(request: Request, response: Response) {
    try {
      const planId = await validateRequest(request, response);
      if (planId == null) return;

      const payments = await MonthlyPaymentService.listWithNextCharge(planId);
      return returnJson(response, 200, payments);
    } catch (error) {
      console.error("Error in getMonthlyPayments:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }

  /** DELETE /monthly-payments/:id (preserves existing transactions) */
  export async function deleteMonthlyPayment(request: Request, response: Response) {
    try {
      const id = await validateExistingRequest(request, response);
      if (id == null) return;

      await MonthlyPaymentRepository.deleteById(id);
      return response.status(204).send();
    } catch (error) {
      console.error("Error in deleteMonthlyPayment:", error);
      return returnJson(response, 500, { code: 500, message: "Internal server error" });
    }
  }
}
