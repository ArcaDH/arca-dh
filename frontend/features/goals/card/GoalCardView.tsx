import type { FC } from "react";
import { Check, Goal } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatWholeKr } from "@/lib/money";

interface GoalCardViewProps {
  name: string;
  target: number;
  saved: number;
  monthly: number;
  remaining: string;
  deadline: string | null;
  isDone: boolean;
  reached: string | null;
  took: string | null;
  onOpen: () => void;
}

export const GoalCardView: FC<GoalCardViewProps> = ({
  name,
  target,
  saved,
  monthly,
  remaining,
  deadline,
  isDone,
  reached,
  took,
  onOpen,
}) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${name}: ${formatWholeKr(saved)} of ${formatWholeKr(target)} saved, open`}
      className={`group flex cursor-pointer flex-col rounded-xl border p-4 text-left transition-[border-color,box-shadow,translate] hover:-translate-y-0.5 hover:shadow-md ${isDone ? "border-success/25 bg-success/[0.03] hover:border-success/40" : "border-foreground/10 bg-white hover:border-primary/30"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Goal
            size={18}
            strokeWidth={1.75}
            className={`shrink-0 ${isDone ? "text-success" : "text-muted"}`}
            aria-hidden
          />
          <span className="truncate font-heading font-semibold group-hover:text-primary">{name}</span>
        </div>
        {isDone && (
          <StatusBadge tone="success" icon={Check} celebrate>
            Done
          </StatusBadge>
        )}
      </div>
      <p className="mt-0.5 pl-[26px] text-xs text-muted">
        {isDone ? `Reached ${reached ?? ""}`.trim() : deadline ? `by ${deadline}` : "No end date"}
      </p>

      <div className="my-4 flex justify-center">
        <ProgressRing
          value={target > 0 ? saved / target : 0}
          size={132}
          thickness={12}
          color={isDone ? "text-success" : "text-primary"}
          label={`${formatWholeKr(saved)} of ${formatWholeKr(target)} saved`}
        >
          <span className="font-heading text-xl font-bold tabular-nums">{formatWholeKr(saved)}</span>
          <span className="text-xs text-muted tabular-nums">of {formatWholeKr(target)}</span>
        </ProgressRing>
      </div>

      <dl className="mt-auto grid grid-cols-2 border-t border-foreground/10 pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted">{isDone ? "Saved" : "Monthly"}</dt>
          <dd className="font-medium tabular-nums">
            {isDone ? formatWholeKr(saved) : monthly > 0 ? formatWholeKr(monthly) : "–"}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-muted">{isDone ? "Took" : "Remaining"}</dt>
          <dd className="font-medium tabular-nums">{isDone ? (took ?? "–") : remaining}</dd>
        </div>
      </dl>
    </button>
  );
};
