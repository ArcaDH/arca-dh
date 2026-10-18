import { Check, Pencil, Trash2 } from "lucide-react";
import type { FC } from "react";
import Button from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatShortDate } from "@/lib/format";
import { formatWholeKr } from "@/lib/money";
import type { Transaction } from "@/types/transaction";

interface GoalDetailViewProps {
  name: string;
  target: number;
  saved: number;
  savedThisMonth: number;
  monthly: number;
  remaining: string;
  timeShare: number;
  deadline: string | null;
  isDone: boolean;
  reached: string | null;
  savings: Transaction[] | null;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const GoalDetailView: FC<GoalDetailViewProps> = ({
  name,
  target,
  saved,
  savedThisMonth,
  monthly,
  remaining,
  timeShare,
  deadline,
  isDone,
  reached,
  savings,
  onEdit,
  onDelete,
  onClose,
}) => {
  return (
    <Dialog title={name} onClose={onClose}>
      <p className="text-sm text-muted">
        {isDone
          ? `Reached${reached ? ` ${reached}` : ""}. Nice work!`
          : deadline
            ? `${formatWholeKr(target)} by ${deadline}`
            : "No end date"}
      </p>

      <div className="mt-4 flex justify-center">
        <ProgressRing
          value={target > 0 ? saved / target : 0}
          size={196}
          thickness={18}
          color={isDone ? "text-success" : "text-primary"}
          label={`${formatWholeKr(saved)} of ${formatWholeKr(target)} saved`}
        >
          <span className="font-heading text-3xl font-bold tabular-nums">{formatWholeKr(saved)}</span>
          <span className="text-sm">Saved so far</span>
          <span className="text-xs text-muted tabular-nums">{formatWholeKr(target)} total</span>
          {isDone && (
            <span className="mt-1.5">
              <StatusBadge tone="success" icon={Check} celebrate>
                Done
              </StatusBadge>
            </span>
          )}
        </ProgressRing>
      </div>

      <div className="-mt-12 flex items-end justify-between">
        <ProgressRing
          value={monthly > 0 ? savedThisMonth / monthly : 1}
          size={92}
          thickness={8}
          color="text-success"
          label={`${formatWholeKr(savedThisMonth)} of ${formatWholeKr(monthly)} saved this month`}
        >
          <span className="font-heading font-bold tabular-nums">
            {isDone || monthly <= 0 ? "–" : formatWholeKr(monthly)}
          </span>
          <span className="text-xs text-muted">Monthly</span>
        </ProgressRing>

        <ProgressRing
          value={timeShare}
          size={92}
          thickness={8}
          color="text-muted"
          label={deadline ? `${remaining} left until ${deadline}` : `${remaining} left at this pace`}
        >
          <span className="font-heading font-bold tabular-nums">{isDone ? "–" : remaining}</span>
          <span className="text-xs text-muted">Remaining</span>
        </ProgressRing>
      </div>

      <section aria-label="History" className="mt-5">
        <h3 className="mb-1 text-xs font-semibold text-muted">History</h3>
        {savings === null ? (
          <p className="py-2 text-sm text-muted">Loading…</p>
        ) : savings.length === 0 ? (
          <p className="py-2 text-sm text-muted">Nothing saved yet. Log a saving under Transactions.</p>
        ) : (
          <ul className="max-h-40 overflow-y-auto">
            {savings.map((saving) => (
              <li
                key={saving.id}
                className="flex items-center gap-3 border-b border-foreground/5 py-1.5 text-sm last:border-b-0"
              >
                <span className="w-14 text-muted tabular-nums">{formatShortDate(saving.date)}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{saving.description}</span>
                <span className="font-medium tabular-nums">+{formatWholeKr(saving.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={14} aria-hidden />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="hover:text-accent">
            <Trash2 size={14} aria-hidden />
            Delete
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};
