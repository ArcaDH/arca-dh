// types/plan.ts: matches what the backend sends for a budget plan
export type Plan = {
  id: string;
  name: string;
  current: boolean; // true for the plan the user is working in
};

export type PlanInput = {
  name: string;
};
