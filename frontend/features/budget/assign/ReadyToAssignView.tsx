import type { FC } from "react";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { SubcategoryIcon } from "@/components/icons/SubcategoryIcon";
import { Dropdown } from "@/components/ui/Dropdown";
import { formatWholeKr } from "@/lib/money";
import type { AssignGroup } from "@/types/budget";

interface ReadyToAssignViewProps {
  toAssign: number;
  income: number;
  assigned: number;
  groups: AssignGroup[];
  amount: string;
  error: string | null;
  isSaving: boolean;
  onAmountChange: (amount: string) => void;
  onAssign: (subcategoryId: string, close: () => void) => void;
  onEditIncome: () => void;
}

export const ReadyToAssignView: FC<ReadyToAssignViewProps> = ({
  toAssign,
  income,
  assigned,
  groups,
  amount,
  error,
  isSaving,
  onAmountChange,
  onAssign,
  onEditIncome,
}) => {
  const tone =
    toAssign < 0
      ? "bg-accent/10 text-accent hover:bg-accent/15"
      : toAssign === 0
        ? "bg-success/10 text-success hover:bg-success/15"
        : "bg-primary/10 text-primary hover:bg-primary/15";
  const filledGroups = groups.filter((group) => group.subcategories.length > 0);

  return (
    <dl className="flex items-center gap-5 text-sm">
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
        <dt className="sr-only">{toAssign < 0 ? "Over-assigned" : "Unassigned"}</dt>
        <dd>
          <Dropdown
            align="end"
            label={`${formatWholeKr(Math.abs(toAssign))} ${toAssign < 0 ? "over-assigned" : "unassigned"}, assign money`}
            triggerClassName={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 whitespace-nowrap transition-colors ${tone}`}
            trigger={
              <>
                {toAssign === 0 ? (
                  <span>All assigned</span>
                ) : (
                  <>
                    <span>{toAssign < 0 ? "Over-assigned" : "Assign"}</span>
                    <span className="font-semibold tabular-nums">{formatWholeKr(Math.abs(toAssign))}</span>
                  </>
                )}
                <ChevronDown size={14} aria-hidden />
              </>
            }
          >
            {(close) => (
              <div className="w-80 p-2 text-left text-sm font-normal text-foreground">
                {filledGroups.length === 0 && (
                  <p className="p-2 text-muted">Add a subcategory first, then assign money to it here.</p>
                )}
                {filledGroups.length > 0 && (
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
                      {filledGroups.map((group) => (
                        <div key={group.name} role="group" aria-label={group.name}>
                          <p className="px-2 pt-2 pb-1 text-xs font-semibold text-muted">{group.name}</p>
                          {group.subcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              type="button"
                              disabled={isSaving}
                              onClick={() => onAssign(subcategory.id, close)}
                              aria-label={`Assign to ${subcategory.name}, now ${formatWholeKr(subcategory.assigned)}`}
                              className="group flex w-full cursor-pointer items-center gap-2 border-b border-foreground/5 px-2 py-1.5 text-left transition-colors last:border-b-0 hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
                            >
                              <SubcategoryIcon size={15} className="shrink-0 text-muted" aria-hidden />
                              <span className="min-w-0 flex-1 truncate group-hover:text-primary">
                                {subcategory.name}
                              </span>
                              <span
                                className={`tabular-nums ${subcategory.assigned > 0 ? "text-foreground/80" : "text-muted"}`}
                              >
                                {formatWholeKr(subcategory.assigned)}
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
