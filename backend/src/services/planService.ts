import { PlanRepository } from "../repositories/planRepository";
import { UserRepository } from "../repositories/userRepository";
import type { UserModel } from "../db/schema";
import { isValidMonth } from "./monthlyDates";

// Valid plan month or validation error code
export type PlanMonth = { month: string } | { error: "invalid" | "past" };

export namespace PlanService {
  // Validate format and ensure month is not in the past
  const checkMonth = (input: unknown, thisMonth: string): PlanMonth => {
    if (!isValidMonth(input)) return { error: "invalid" };
    const month = input.trim();
    return month < thisMonth ? { error: "past" } : { month };
  };

  // Defaults to current month if unspecified
  export const monthForNewPlan = (input: unknown, thisMonth: string): PlanMonth =>
    input === null || input === undefined || (typeof input === "string" && input.trim() === "")
      ? { month: thisMonth }
      : checkMonth(input, thisMonth);

  // Retains existing month if unspecified
  export const monthForUpdatedPlan = (input: unknown, planMonth: string, thisMonth: string): PlanMonth =>
    input === null || input === undefined || input === "" ? { month: planMonth } : checkMonth(input, thisMonth);

  // Set as current plan if user has none
  export async function createPlanForUser(
    user: Pick<UserModel, "userId" | "currentPlanId">,
    name: string,
    month: string,
  ) {
    const plan = await PlanRepository.createPlan({ name, month, userId: user.userId });
    if (!user.currentPlanId) await UserRepository.updateCurrentPlanId(user.userId, plan.id);
    return { plan, current: !user.currentPlanId || user.currentPlanId === plan.id };
  }

  // Clear currentPlanId if deleting the active plan
  export async function deletePlanForUser(user: Pick<UserModel, "userId" | "currentPlanId">, planId: string) {
    if (user.currentPlanId === planId) await UserRepository.updateCurrentPlanId(user.userId, null);
    await PlanRepository.deletePlan(planId);
  }
}
