// types/plan.ts: matches what the backend sends for a budget plan
export type Plan = {
  id: string;
  name: string;
  month: string; // "YYYY-MM"
  current: boolean;
};
