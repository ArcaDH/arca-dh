import { Plus } from "lucide-react";
import type { FC, ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import Button from "@/components/ui/button";
import { formatWholeKr } from "@/lib/money";
import type { GoalCard, GoalFilter } from "@/types/goal";

const FILTERS: { value: GoalFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "In progress" },
  { value: "done", label: "Done" },
];
import { GoalCardView } from "./card/GoalCardView";

interface GoalsViewProps {
  cards: GoalCard[] | null;
  counts: Record<GoalFilter, number>;
  filter: GoalFilter;
  totalSaved: number;
  totalTarget: number;
  neededThisMonth: number;
  errorMessage: string | null;
  dialog: ReactNode;
  onFilterChange: (filter: GoalFilter) => void;
  onAddGoal: () => void;
  onOpenGoal: (goalId: string) => void;
}

export const GoalsView: FC<GoalsViewProps> = ({
  cards,
  counts,
  filter,
  totalSaved,
  totalTarget,
  neededThisMonth,
  errorMessage,
  dialog,
  onFilterChange,
  onAddGoal,
  onOpenGoal,
}) => {
  return (
    <div>
      <PageHeader
        aside={
          cards && (
            <dl className="flex items-center gap-5 text-sm">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted">Saved</dt>
                <dd className="font-medium tabular-nums">
                  {formatWholeKr(totalSaved)}
                  <span className="font-normal text-muted"> of {formatWholeKr(totalTarget)}</span>
                </dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted">Monthly</dt>
                <dd className="font-medium tabular-nums">{formatWholeKr(neededThisMonth)}</dd>
              </div>
            </dl>
          )
        }
      >
        <h1 className="text-lg font-semibold">Savings goals</h1>
      </PageHeader>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div role="group" aria-label="Show goals" className="flex gap-5 text-sm">
          {FILTERS.map(({ value, label }) => {
            const isActive = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFilterChange(value)}
                className={`-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 pt-1 pb-2 transition-colors ${
                  isActive
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {label}
                <span className="text-xs text-muted tabular-nums">{counts[value]}</span>
              </button>
            );
          })}
        </div>
        <Button size="sm" aria-label="New savings goal" title="New savings goal" onClick={onAddGoal} className="mb-1">
          New
          <Plus size={15} strokeWidth={2.5} aria-hidden />
        </Button>
      </div>

      {errorMessage && (
        <p role="alert" className="mb-4 bg-accent/10 px-4 py-3 text-sm text-accent">
          {errorMessage}
        </p>
      )}

      {!cards ? (
        !errorMessage && <p className="py-8 text-sm text-muted">Loading…</p>
      ) : cards.length === 0 ? (
        <p className="py-8 text-sm text-muted">
          {counts.all === 0 ? "No savings goals yet. Add one with New." : "No goals here."}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {cards.map((card) => (
            <GoalCardView
              key={card.goalId}
              name={card.name}
              target={card.target}
              saved={card.saved}
              monthly={card.monthly}
              remaining={card.remaining}
              deadline={card.deadline}
              isDone={card.isDone}
              reached={card.reached}
              took={card.took}
              onOpen={() => onOpenGoal(card.goalId)}
            />
          ))}
        </div>
      )}

      {dialog}
    </div>
  );
};
