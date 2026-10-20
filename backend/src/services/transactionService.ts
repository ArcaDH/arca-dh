import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { TransactionRepository } from "../repositories/transactionRepository";
import type { validateTransactionData } from "../validators/transactions";
import { handledThroughFor, monthOf, todayOf } from "./monthlyDates";

type TransactionData = NonNullable<Awaited<ReturnType<typeof validateTransactionData>>>;

export namespace TransactionService {
  /**
   * Create a transaction. A repeating expense also starts a monthly payment: the payment and the
   * transaction the user logged are created together, and the payment counts this month as handled.
   */
  export async function createTransaction(planId: string, data: TransactionData, now: Date) {
    const { tagIds, repeatMonthly, ...fields } = data;

    if (!repeatMonthly) return TransactionRepository.createTransaction({ ...fields, budgetPlanId: planId }, tagIds);

    const transactionId = await MonthlyPaymentRepository.createWithTransaction(
      {
        budgetPlanId: planId,
        amount: fields.amount,
        description: fields.description,
        dayOfMonth: repeatMonthly.dayOfMonth,
        generatedThrough: handledThroughFor(fields.date, todayOf(now), repeatMonthly.dayOfMonth),
        // An expense always has a category, the validator makes sure of it
        categoryId: fields.categoryId as string,
        subcategoryId: fields.subcategoryId,
      },
      { ...fields, budgetPlanId: planId },
      tagIds ?? [],
      monthOf(fields.date),
    );
    return TransactionRepository.findFormattedById(transactionId);
  }
}
