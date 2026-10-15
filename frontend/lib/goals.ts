import { formatDate, toISODate } from "@/lib/format";
import { sumKr } from "@/lib/money";
import type { GoalCard } from "@/types/goal";
import type { GoalProgress } from "@/types/overview";
import type { Transaction } from "@/types/transaction";

const MONTH_MS = (365.25 / 12) * 24 * 60 * 60 * 1000;

export function monthsLeft(month: string, deadline: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  const [deadlineYear, deadlineMonth] = deadline.split("-").map(Number);
  return Math.max((deadlineYear - year) * 12 + (deadlineMonth - monthNumber) + 1, 1);
}

export const isGoalDone = (goal: GoalProgress): boolean => goal.savedAmount >= goal.targetAmount;

// What to save each month from `month` to have `remaining` by the deadline
export const monthlyFor = (remaining: number, month: string, deadline: string): number =>
  Math.ceil(Math.max(remaining, 0) / monthsLeft(month, deadline));

// The amount the user chose, otherwise what the deadline needs (counted from the start of month)
export function plannedMonthly(goal: GoalProgress, month: string): number {
  if (goal.monthlyAmount !== null) return goal.monthlyAmount;
  if (!goal.deadline) return 0;
  return monthlyFor(goal.targetAmount - (goal.savedAmount - goal.savedThisMonth), month, goal.deadline);
}

// What a goal is budgeted each month, like a subcategorys limit. A reached goal needs nothing more
export const goalAssigned = (goal: GoalProgress, month: string): number =>
  isGoalDone(goal) ? goal.savedThisMonth : plannedMonthly(goal, month);

// Months until a loose goal is reached with monthly pace, null without a pace
export function monthsToReach(goal: GoalProgress, monthly: number): number | null {
  if (monthly <= 0) return null;
  return Math.max(Math.ceil((goal.targetAmount - goal.savedAmount) / monthly), 1);
}

// How much of the time from creating the goal to reaching it has passed, from 0 to 1
export function timeShare(goal: GoalProgress, monthly: number, now: Date): number {
  const start = new Date(goal.createdAt).getTime();
  const months = goal.deadline ? null : monthsToReach(goal, monthly);
  const end = goal.deadline
    ? new Date(`${goal.deadline}T23:59:59`).getTime()
    : months === null
      ? null
      : now.getTime() + months * MONTH_MS;
  if (end === null) return 0;
  if (end <= start) return 1;
  return Math.min(Math.max((now.getTime() - start) / (end - start), 0), 1);
}

// for example 3 becomes "3 mo", 15 becomes "1y 3mo", 24 becomes "2y"
export function durationLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mo`;
  return rest === 0 ? `${years}y` : `${years}y ${rest}mo`;
}

export function remainingLabel(goal: GoalProgress, monthly: number, month: string): string {
  if (goal.deadline) {
    return goal.deadline < toISODate(new Date()) ? "Overdue" : durationLabel(monthsLeft(month, goal.deadline));
  }
  const months = monthsToReach(goal, monthly);
  return months === null ? "–" : `~${durationLabel(months)}`;
}

export function reachedDate(goal: GoalProgress, savings: Transaction[]): string | null {
  const oldestFirst = savings.toSorted((a, b) => a.date.localeCompare(b.date));
  const totals = oldestFirst.map((_, index) => sumKr(oldestFirst.slice(0, index + 1).map((saving) => saving.amount)));
  const index = totals.findIndex((total) => total >= goal.targetAmount);
  return index === -1 ? null : oldestFirst[index].date;
}

// How long from creating the goal to finish
export function tookLabel(goal: GoalProgress, date: string): string {
  const days = Math.max(
    Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(goal.createdAt).getTime()) / 86_400_000),
    1,
  );
  if (days < 31) return days === 1 ? "1 day" : `${days} days`;
  return durationLabel(Math.round((days * 24 * 60 * 60 * 1000) / MONTH_MS));
}

// "2027-06-30" = "Jun 2027"
export const deadlineLabel = (deadline: string): string =>
  new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(`${deadline}T00:00:00`));

// What a goal card shows
export function toGoalCard(goal: GoalProgress, month: string, savings: Transaction[]): GoalCard {
  const monthly = plannedMonthly(goal, month);
  const reached = isGoalDone(goal) ? reachedDate(goal, savings) : null;
  return {
    goalId: goal.goalId,
    name: goal.name,
    target: goal.targetAmount,
    saved: goal.savedAmount,
    savedThisMonth: goal.savedThisMonth,
    monthly,
    remaining: remainingLabel(goal, monthly, month),
    timeShare: timeShare(goal, monthly, new Date()),
    deadline: goal.deadline && deadlineLabel(goal.deadline),
    isDone: isGoalDone(goal),
    reached: reached && formatDate(reached),
    took: reached && tookLabel(goal, reached),
  };
}
