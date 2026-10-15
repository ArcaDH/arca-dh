export type SavingsGoalInput = {
  name: string;
  targetAmount: number;
  deadline: string | null;
  monthlyAmount: number | null;
};

export type SavingsGoal = SavingsGoalInput & { id: string; savedAmount: number; progress: number };

export type GoalForm = { name: string; target: string; hasDeadline: boolean; deadline: string; monthly: string };

export type GoalFilter = "all" | "active" | "done";

// What a goal card and the detail popup show
export type GoalCard = {
  goalId: string;
  name: string;
  target: number;
  saved: number;
  savedThisMonth: number;
  monthly: number;
  remaining: string; // "8 mo", "~1y 3mo", "Overdue" or "-"
  timeShare: number;
  deadline: string | null;
  isDone: boolean;
  reached: string | null;
  took: string | null;
};
