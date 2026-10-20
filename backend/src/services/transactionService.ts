import { MonthlyPaymentRepository } from "../repositories/monthlyPaymentRepository";
import { TransactionRepository } from "../repositories/transactionRepository";
import type { validateTransactionData } from "../validators/transactions";
import { handledThroughFor, monthOf, todayOf } from "./monthlyDates";

type TransactionData = NonNullable<Awaited<ReturnType<typeof validateTransactionData>>>;

export namespace TransactionService {
  /** Create a transaction, initializing a recurring monthly payment if repeatMonthly is set. */
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
        // Category is guaranteed by validator for expenses
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
