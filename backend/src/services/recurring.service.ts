import { NotFoundError } from "../errors";
import { nextChargeDate, todayISO } from "../lib/dates";
import { MonthlyPaymentDto } from "../models/transaction.model";
import { recurringRepository } from "../repositories/recurring.repository";
import { requireCurrentPlanId } from "./currentPlan";

/**
 * Creates the transactions of every monthly payment that came due since the last time. It runs
 * whenever the transaction list or the monthly payments are loaded, so nothing has to run on a schedule.
 */
async function catchUp(planId: string): Promise<void> {
  const today = todayISO();
  for (const payment of await recurringRepository.listActive(planId)) {
    await recurringRepository.generateDue(payment.id, today);
  }
}

export const recurringService = {
  catchUp,

  /** The active monthly payments, soonest charge first. */
  async list(userId: number): Promise<MonthlyPaymentDto[]> {
    const planId = await requireCurrentPlanId(userId);
    await catchUp(planId);
    const payments = await recurringRepository.listActive(planId);
    return payments
      .map((payment) => ({
        id: payment.id,
        description: payment.description,
        amount: payment.amount,
        dayOfMonth: payment.dayOfMonth,
        nextCharge: nextChargeDate(payment),
        category: payment.category ? { id: payment.category.id, name: payment.category.name } : null,
      }))
      .sort((a, b) => a.nextCharge.localeCompare(b.nextCharge));
  },

  /** Stops a monthly payment. Transactions it already created stay. */
  async stop(userId: number, id: string): Promise<void> {
    const planId = await requireCurrentPlanId(userId);
    if (!(await recurringRepository.end(id, planId, todayISO()))) {
      throw new NotFoundError("Monthly payment not found.");
    }
  },
};
