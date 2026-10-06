import { BadRequestError, NotFoundError } from "../errors";
import { chargeDate, monthStart, todayISO } from "../lib/dates";
import { CreateTransactionInput, ListTransactionsQuery, TransactionDto } from "../models/transaction.model";
import { categoriesRepository } from "../repositories/categories.repository";
import { recurringRepository } from "../repositories/recurring.repository";
import { tagsRepository } from "../repositories/tags.repository";
import { transactionsRepository } from "../repositories/transactions.repository";
import { requireCurrentPlanId } from "./currentPlan";
import { recurringService } from "./recurring.service";
import { toTagDto } from "./tags.service";

type TransactionRow = NonNullable<Awaited<ReturnType<typeof transactionsRepository.findInPlan>>>;

const toDto = (row: TransactionRow): TransactionDto => ({
  id: row.id,
  amount: row.amount,
  date: row.date,
  description: row.description,
  type: row.type,
  category: row.category ? { id: row.category.id, name: row.category.name } : null,
  subcategory: row.subcategory ? { id: row.subcategory.id, name: row.subcategory.name } : null,
  tags: row.tags.map(({ tag }) => toTagDto(tag)).sort((a, b) => a.name.localeCompare(b.name)),
  recurringId: row.recurringTransactionId,
});

async function getOne(planId: string, id: string): Promise<TransactionDto> {
  const row = await transactionsRepository.findInPlan(id, planId);
  if (!row) throw new NotFoundError("Transaction not found.");
  return toDto(row);
}

/** Makes sure the category, subcategory and tags exist and belong to this user's plan. */
async function checkLinks(
  userId: number,
  planId: string,
  { categoryId, subcategoryId }: { categoryId?: string | null; subcategoryId?: string | null },
  tagIds: string[],
): Promise<void> {
  if (subcategoryId && !categoryId) throw new BadRequestError("Pick a category before picking a subcategory.");
  if (categoryId && !(await categoriesRepository.findInPlan(categoryId, planId))) {
    throw new NotFoundError("Category not found.");
  }
  if (categoryId && subcategoryId && !(await categoriesRepository.findSubcategory(subcategoryId, categoryId))) {
    throw new NotFoundError("Subcategory not found.");
  }
  if (tagIds.length > 0 && (await tagsRepository.findOwned(userId, tagIds)).length !== tagIds.length) {
    throw new NotFoundError("One of the tags was not found.");
  }
}

export const transactionsService = {
  async list(userId: number, query: ListTransactionsQuery): Promise<{ items: TransactionDto[]; hasMore: boolean }> {
    const planId = await requireCurrentPlanId(userId);
    await recurringService.catchUp(planId);
    // The repository returns one row more than asked for, to know if there are more pages
    const rows = await transactionsRepository.list(planId, query);
    return { items: rows.slice(0, query.limit).map(toDto), hasMore: rows.length > query.limit };
  },

  /** What the form needs to fill its dropdowns: the plan's categories and the user's tags. */
  async formOptions(userId: number) {
    const planId = await requireCurrentPlanId(userId);
    const [categories, tags] = await Promise.all([
      categoriesRepository.listWithSubcategories(planId),
      tagsRepository.listForUser(userId),
    ]);
    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        subcategories: category.subcategories
          .map((sub) => ({ id: sub.id, name: sub.name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
      tags: tags.map(toTagDto),
    };
  },

  /** @param month e.g. "2026-09" */
  async monthTotal(userId: number, month: string): Promise<{ month: string; total: number }> {
    const planId = await requireCurrentPlanId(userId);
    // The total is loaded next to the list, so it must count payments that just came due too
    await recurringService.catchUp(planId);
    const first = `${month}-01`;
    return { month, total: await transactionsRepository.expenseTotal(planId, first, chargeDate(first, 31)) };
  },

  async create(userId: number, input: CreateTransactionInput): Promise<TransactionDto> {
    const planId = await requireCurrentPlanId(userId);
    const tagIds = [...new Set(input.tagIds)];
    await checkLinks(userId, planId, input, tagIds);

    const links = { categoryId: input.categoryId ?? null, subcategoryId: input.subcategoryId ?? null };
    const description = input.description || null;

    // The transaction being logged counts as its month's payment, so the monthly payment starts next month
    const monthlyPayment = input.repeatMonthly
      ? await recurringRepository.insert({
          amount: input.amount,
          description,
          dayOfMonth: input.repeatMonthly.dayOfMonth,
          startDate: input.date,
          generatedThrough: monthStart(input.date),
          tagIds,
          budgetPlanId: planId,
          ...links,
        })
      : undefined;

    const created = await transactionsRepository.insertWithTags(
      {
        amount: input.amount,
        date: input.date,
        description,
        type: "EXPENSE",
        budgetPlanId: planId,
        recurringTransactionId: monthlyPayment?.id ?? null,
        ...links,
      },
      tagIds,
    );
    return getOne(planId, created.id);
  },

  /**
   * Deleting a transaction that came from a monthly payment only skips that month, because the
   * payment remembers how far it has come. `stopRecurring` also ends the monthly payment.
   */
  async remove(userId: number, id: string, stopRecurring: boolean): Promise<void> {
    const planId = await requireCurrentPlanId(userId);
    const removed = await transactionsRepository.remove(id, planId);
    if (!removed) throw new NotFoundError("Transaction not found.");
    if (stopRecurring && removed.recurringTransactionId) {
      await recurringRepository.end(removed.recurringTransactionId, planId, todayISO());
    }
  },
};
