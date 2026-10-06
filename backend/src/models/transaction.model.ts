import { z } from "zod";
import { IsoDate } from "./common.model";
import { TagDto } from "./tag.model";

// Money is always a whole number of öre: 100 öre = 1 kr
export const MIN_AMOUNT = 100; // 1 kr
export const MAX_AMOUNT = 100_000_000; // 1 000 000 kr
export const MAX_TAGS_PER_TRANSACTION = 5;

const Amount = z
  .number("Amount is required.")
  .int("Amount must be a whole number of öre.")
  .min(MIN_AMOUNT, "Amount must be at least 1 kr.")
  .max(MAX_AMOUNT, "Amount can be at most 1 000 000 kr.");

const TransactionFields = {
  amount: Amount,
  date: IsoDate,
  description: z.string().trim().max(500, "Description can be at most 500 characters.").optional(),
  categoryId: z.guid().nullish(),
  subcategoryId: z.guid().nullish(),
  tagIds: z
    .array(z.guid())
    .max(MAX_TAGS_PER_TRANSACTION, `A transaction can have at most ${MAX_TAGS_PER_TRANSACTION} tags.`)
    .default([]),
};

export const CreateTransactionInput = z.object({
  ...TransactionFields,
  // Set when the "repeat monthly" box is ticked
  repeatMonthly: z.object({ dayOfMonth: z.number().int().min(1).max(31) }).optional(),
});

// Filters arrive as query-string text, so numbers are coerced and the tag list is comma separated
const CommaSeparatedIds = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",") : []))
  .pipe(z.array(z.guid()).max(20, "Too many tags in the filter."));

export const ListTransactionsQuery = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.guid().optional(),
  tagIds: CommaSeparatedIds,
  tagMode: z.enum(["any", "all"]).default("any"),
  from: IsoDate.optional(),
  to: IsoDate.optional(),
  minAmount: z.coerce.number().int().min(0).optional(),
  maxAmount: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["date", "amount"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(500).default(25),
});

export const MonthSummaryQuery = z.object({
  month: z.string("Month is required.").regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-09."),
});

export const DeleteTransactionQuery = z.object({
  stopRecurring: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionInput>;
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuery>;

/** A transaction as sent to clients, with its category, subcategory and tags filled in. */
export interface TransactionDto {
  id: string;
  amount: number; // öre
  date: string;
  description: string | null;
  type: "EXPENSE" | "INCOME";
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  tags: TagDto[];
  recurringId: string | null;
}

/** An active monthly payment, for the side panel. */
export interface MonthlyPaymentDto {
  id: string;
  description: string | null;
  amount: number; // öre
  dayOfMonth: number;
  nextCharge: string;
  category: { id: string; name: string } | null;
}
