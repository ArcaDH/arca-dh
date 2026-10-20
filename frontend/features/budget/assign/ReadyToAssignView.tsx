import type { FC } from "react";
import { ChevronDown, Goal, Pencil, Plus, Target, Wallet } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { formatWholeKr } from "@/lib/money";
import type { AssignState, BudgetGroup, BudgetLine } from "@/types/budget";

const assignTone: Record<AssignState, string> = {
  left: "bg-primary/10 text-primary hover:bg-primary/15",
  done: "bg-success/10 text-success hover:bg-success/15",
  over: "bg-accent/10 text-accent hover:bg-accent/15",
};

interface ReadyToAssignViewProps {
  assignState: AssignState;
  toAssign: number;
  income: number;
  assigned: number;
  // The groups that still have something to assign to
  groups: BudgetGroup[];
  amount: string;
  error: string | null;
  isSaving: boolean;
  isFunding: boolean;
  // Whether any subcategory in the plan has a target to fund.
  hasTargets: boolean;
  onAmountChange: (amount: string) => void;
  onAssign: (line: BudgetLine, close: () => void) => void;
  onFundAllTargets: (close: () => void) => void;
  onEditIncome: () => void;
}

export const ReadyToAssignView: FC<ReadyToAssignViewProps> = ({
  assignState,
  toAssign,
  income,
  assigned,
  groups,
  amount,
  error,
  isSaving,
  isFunding,
  hasTargets,
  onAmountChange,
  onAssign,
  onFundAllTargets,
  onEditIncome,
}) => {
  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <div className="flex items-baseline gap-1.5">
        <dt className="text-muted">Income</dt>
        <dd>
          <button
            type="button"
            onClick={onEditIncome}
            aria-label={`Income ${formatWholeKr(income)}, edit`}
            className="group flex cursor-pointer items-center gap-1 rounded-sm font-medium tabular-nums hover:text-primary"
          >
            {formatWholeKr(income)}
            <Pencil size={12} className="text-muted group-hover:text-primary" aria-hidden />
          </button>
        </dd>
      </div>

      <div className="flex items-baseline gap-1.5">
        <dt className="text-muted">Assigned</dt>
        <dd className="font-medium tabular-nums">{formatWholeKr(assigned)}</dd>
      </div>

      <div className="flex items-center">
        <dt className="sr-only">{assignState === "over" ? "Over-assigned" : "Unassigned"}</dt>
        <dd>
          <Dropdown
            align="end"
            label={`${formatWholeKr(Math.abs(toAssign))} ${assignState === "over" ? "over-assigned" : "unassigned"}, assign money`}
            triggerClassName={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 whitespace-nowrap transition-colors ${assignTone[assignState]}`}
            trigger={
              <>
                {assignState === "done" ? (
                  <span>All assigned</span>
                ) : (
                  <>
                    <span>{assignState === "over" ? "Over-assigned" : "Assign"}</span>
                    <span className="font-semibold tabular-nums">{formatWholeKr(Math.abs(toAssign))}</span>
                  </>
                )}
                <ChevronDown size={14} aria-hidden />
              </>
            }
          >
            {(close) => (
              <div className="w-80 p-2 text-left text-sm font-normal text-foreground">
                {/* Fund every target for the month in one click. */}
                {hasTargets && (
                  <button
                    type="button"
                    disabled={isFunding || isSaving}
                    onClick={() => onFundAllTargets(close)}
                    className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-sm bg-primary/10 px-2.5 py-2 text-left font-medium text-primary transition-colors hover:bg-primary/15 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Target size={15} strokeWidth={2} aria-hidden />
                    <span className="flex-1">{isFunding ? "Funding targets…" : "Fund all targets"}</span>
                  </button>
                )}

                {groups.length === 0 && (
                  <p className="p-2 text-muted">
                    Add a subcategory or savings goal first, then assign money to it here.
                  </p>
                )}
                {groups.length > 0 && (
                  <div>
                    <label className="flex items-center gap-3">
                      <span className="w-12 font-semibold">Assign</span>
                      <span className="relative flex-1">
                        <input
                          autoFocus
                          inputMode="decimal"
                          placeholder={String(Math.max(Math.round(toAssign), 0))}
                          value={amount}
                          onChange={(event) => onAmountChange(event.target.value)}
                          className="w-full rounded-sm border border-foreground/20 bg-white py-1 pr-8 pl-2 text-right text-base font-semibold tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted">
                          kr
                        </span>
                      </span>
                    </label>

                    <p className="mt-3 mb-1 font-semibold">To</p>
                    <div className="-mx-1 max-h-72 overflow-y-auto">
                      {groups.map((group) => (
                        <div key={group.name} role="group" aria-label={group.name}>
                          <p className="px-2 pt-2 pb-1 text-xs font-semibold text-muted">{group.name}</p>
                          {group.lines.map((line) => (
                            <button
                              key={line.id}
                              type="button"
                              disabled={isSaving}
                              onClick={() => onAssign(line, close)}
                              aria-label={`Assign to ${line.name}, now ${formatWholeKr(line.assigned)}`}
                              className="group flex w-full cursor-pointer items-center gap-2 border-b border-foreground/5 px-2 py-1.5 text-left transition-colors last:border-b-0 hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
                            >
                              {line.kind === "goal" ? (
                                <Goal size={15} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden />
                              ) : (
                                <Wallet size={15} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden />
                              )}
                              <span className="min-w-0 flex-1 truncate group-hover:text-primary">{line.name}</span>
                              <span
                                className={`tabular-nums ${line.assigned > 0 ? "text-foreground/80" : "text-muted"}`}
                              >
                                {formatWholeKr(line.assigned)}
                              </span>
                              {/* A plus that lights up on hover, so the rows read as buttons */}
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-foreground/5 text-foreground/40 transition-colors group-hover:bg-primary group-hover:text-white group-focus-visible:bg-primary group-focus-visible:text-white">
                                <Plus size={13} strokeWidth={2.5} aria-hidden />
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p role="alert" className="mt-2 text-xs text-accent">
                    {error}
                  </p>
                )}
              </div>
            )}
          </Dropdown>
        </dd>
      </div>
    </dl>
  );
};
