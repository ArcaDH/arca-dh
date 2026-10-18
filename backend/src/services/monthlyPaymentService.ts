import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { dueDate, dueMonths, nextChargeDate, todayOf } from "./monthlyDates";

export namespace MonthlyPaymentService {
  /**
   * Create the transactions of a plan's monthly payments that are due by today and not made yet.
   * There is no scheduler: this runs when a page asks for the plan's transactions or overview.
   * A failure is logged and never stops the request that called it.
   */
  export async function ensureGenerated(planId: string, now: Date = new Date()) {
    try {
      const today = todayOf(now);
      const payments = await MonthlyPaymentRepository.findByPlanId(planId);

      for (const payment of payments) {
        const periods = dueMonths(payment, today).map((month) => ({
          month,
          date: dueDate(month, payment.dayOfMonth),
        }));
        if (periods.length > 0) await MonthlyPaymentRepository.createDueTransactions(payment, periods);
      }
    } catch (error) {
      console.error("Error creating monthly payments:", error);
    }
  }

  /**
   * A plan's monthly payments, each with the day it is next due
   */
  export async function listWithNextCharge(planId: string, now: Date = new Date()) {
    const today = todayOf(now);
    const payments = await MonthlyPaymentRepository.findByPlanId(planId);
    return payments.map(({ budgetPlanId, generatedThrough, ...payment }) => ({
      ...payment,
      nextCharge: nextChargeDate({ generatedThrough, dayOfMonth: payment.dayOfMonth }, today),
    }));
  }
}
