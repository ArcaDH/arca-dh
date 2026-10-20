import { PlanRepository } from "../repositories/planRepository";
import { UserRepository } from "../repositories/userRepository";
import type { UserModel } from "../db/schema";
import { isValidMonth } from "./monthlyDates";

// The month a plan ends up with, or why the given month can't be used
export type PlanMonth = { month: string } | { error: "invalid" | "past" };

export namespace PlanService {
  // A given month must be "YYYY-MM" and can't be before this month
  const checkMonth = (input: unknown, thisMonth: string): PlanMonth => {
    if (!isValidMonth(input)) return { error: "invalid" };
    const month = input.trim();
    return month < thisMonth ? { error: "past" } : { month };
  };

  // A new plan without a month (also blank text) is for this month
  export const monthForNewPlan = (input: unknown, thisMonth: string): PlanMonth =>
    input === null || input === undefined || (typeof input === "string" && input.trim() === "")
      ? { month: thisMonth }
      : checkMonth(input, thisMonth);

  // Updating a plan without a month keeps the month it has
  export const monthForUpdatedPlan = (input: unknown, planMonth: string, thisMonth: string): PlanMonth =>
    input === null || input === undefined || input === "" ? { month: planMonth } : checkMonth(input, thisMonth);

  // A user's first plan becomes their current plan
  export async function createPlanForUser(
    user: Pick<UserModel, "userId" | "currentPlanId">,
    name: string,
    month: string,
  ) {
    const plan = await PlanRepository.createPlan({ name, month, userId: user.userId });
    if (!user.currentPlanId) await UserRepository.updateCurrentPlanId(user.userId, plan.id);
    return { plan, current: !user.currentPlanId || user.currentPlanId === plan.id };
  }

  // Deleting the current plan leaves the user without a current plan
  export async function deletePlanForUser(user: Pick<UserModel, "userId" | "currentPlanId">, planId: string) {
    if (user.currentPlanId === planId) await UserRepository.updateCurrentPlanId(user.userId, null);
    await PlanRepository.deletePlan(planId);
  }
}
