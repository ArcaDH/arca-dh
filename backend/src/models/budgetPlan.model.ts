import { z } from "zod";

export const BudgetPlanInput = z.object({
  name: z
    .string("Name is required.")
    .trim()
    .min(1, "Name is required.")
    .max(255, "Name can be at most 255 characters."),
});

export const CurrentPlanInput = z.object({
  planId: z.uuid("Plan id format is invalid."),
});

export type BudgetPlanInput = z.infer<typeof BudgetPlanInput>;
export type CurrentPlanInput = z.infer<typeof CurrentPlanInput>;
