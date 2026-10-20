import { parseKr, sumKr } from "@/lib/money";
import type {
  OnboardingSetup,
  OnboardingStep,
  PlannedSummary,
  StarterGroup,
  StarterPicks,
  StarterTileGroup,
} from "@/types/onboarding";

// The steps in order
export const ONBOARDING_STEPS: OnboardingStep[] = ["basics", "categories"];

// Which step this is, counting from 1
export const stepNumber = (step: OnboardingStep): number => ONBOARDING_STEPS.indexOf(step) + 1;

// Common categories to start from, with typical monthly amounts for a student in Sweden hehe
export const STARTER_GROUPS: StarterGroup[] = [
  {
    name: "Home",
    lines: [
      { key: "rent", name: "Rent", suggested: 6000 },
      { key: "electricity", name: "Electricity", suggested: 400 },
      { key: "internet", name: "Internet", suggested: 300 },
    ],
  },
  {
    name: "Food",
    lines: [
      { key: "groceries", name: "Groceries", suggested: 2500 },
      { key: "eating-out", name: "Eating out", suggested: 600 },
    ],
  },
  {
    name: "Transport",
    lines: [{ key: "public-transport", name: "Public transport", suggested: 990 }],
  },
  {
    name: "Fun",
    lines: [
      { key: "subscriptions", name: "Subscriptions", suggested: 200 },
      { key: "going-out", name: "Going out", suggested: 500 },
      { key: "gym", name: "Gym", suggested: 300 },
    ],
  },
];

export const DEFAULT_PICKS: StarterPicks = { rent: "6000", groceries: "2500", "public-transport": "990" };

export const suggestedAmount = (key: string): string =>
  String(STARTER_GROUPS.flatMap((group) => group.lines).find((line) => line.key === key)?.suggested ?? "");

export const starterTiles = (picks: StarterPicks): StarterTileGroup[] =>
  STARTER_GROUPS.map((group) => ({
    name: group.name,
    tiles: group.lines.map((line) => ({ ...line, picked: line.key in picks, amount: picks[line.key] ?? "" })),
  }));

const amountOf = (typed: string): number | null => (typed.trim() === "" ? null : parseKr(typed));

export const picksAreValid = (picks: StarterPicks): boolean =>
  Object.values(picks).every((typed) => typed.trim() === "" || parseKr(typed) !== null);

export const plannedTotal = (picks: StarterPicks): number =>
  sumKr(Object.values(picks).map((typed) => amountOf(typed) ?? 0));

export const plannedSummary = (income: number, picks: StarterPicks): PlannedSummary => {
  const planned = plannedTotal(picks);
  return {
    income,
    planned,
    difference: Math.abs(income - planned),
    share: income > 0 ? planned / income : 0,
    isOver: planned > income,
  };
};

export const onboardingSetup = (planName: string, income: number, picks: StarterPicks): OnboardingSetup => ({
  planName: planName.trim(),
  income,
  categories: STARTER_GROUPS.map((group) => ({
    name: group.name,
    subcategories: group.lines
      .filter((line) => line.key in picks)
      .map((line) => ({ name: line.name, target: amountOf(picks[line.key]) })),
  })).filter((category) => category.subcategories.length > 0),
});
