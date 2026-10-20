import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { dueDate, dueMonths, nextChargeDate, todayOf } from "./monthlyDates";

export namespace MonthlyPaymentService {
  /** Generate transactions for all monthly payments due by today. */
  export async function ensureGenerated(planId: string, now: Date = new Date()) {
    try {
      const today = todayOf(now);
      const payments = await MonthlyPaymentRepository.findByPlanId(planId);

      await Promise.all(
        payments.map((payment) => {
          const periods = dueMonths(payment, today).map((month) => ({
            month,
            date: dueDate(month, payment.dayOfMonth),
          }));
          return periods.length > 0 ? MonthlyPaymentRepository.createDueTransactions(payment, periods) : undefined;
        }),
      );
    } catch (error) {
      console.error("Error creating monthly payments:", error);
    }
  }

  /** List monthly payments for a plan with their next due date. */
  export async function listWithNextCharge(planId: string, now: Date = new Date()) {
    const today = todayOf(now);
    const payments = await MonthlyPaymentRepository.findByPlanId(planId);
    return payments.map(({ budgetPlanId, generatedThrough, ...payment }) => ({
      ...payment,
      nextCharge: nextChargeDate({ generatedThrough, dayOfMonth: payment.dayOfMonth }, today),
    }));
  }
}
