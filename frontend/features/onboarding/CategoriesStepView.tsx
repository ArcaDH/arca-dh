import { Check, House, PartyPopper, ShoppingBasket, TramFront, type LucideIcon } from "lucide-react";
import type { FC } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { MoneyProgress } from "@/components/ui/MoneyProgress";
import { formatWholeKr } from "@/lib/money";
import type { PlannedSummary, StarterTileGroup } from "@/types/onboarding";

const groupIcons: Record<string, LucideIcon> = {
  Home: House,
  Food: ShoppingBasket,
  Transport: TramFront,
  Fun: PartyPopper,
};

interface CategoriesStepViewProps {
  groups: StarterTileGroup[];
  summary: PlannedSummary;
  error: string | null;
  isSaving: boolean;
  onToggle: (key: string) => void;
  onAmountChange: (key: string, amount: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onSubmit: () => void;
}

export const CategoriesStepView: FC<CategoriesStepViewProps> = ({
  groups,
  summary,
  error,
  isSaving,
  onToggle,
  onAmountChange,
  onBack,
  onSkip,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h1 className="text-2xl font-bold tracking-tight">Where does your money go?</h1>
      <p className="mt-1 text-sm text-muted">
        Pick what you spend on each month and how much. We&apos;ll set aside that money for you this month.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => {
          const Icon = groupIcons[group.name];
          return (
            <fieldset key={group.name}>
              <legend className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                {Icon && <Icon size={14} aria-hidden />}
                {group.name}
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.tiles.map((tile) => {
                  const { picked } = tile;
                  return (
                    <div
                      key={tile.key}
                      className={`rounded-xl border p-3 transition-colors ${picked ? "border-primary bg-primary/5" : "border-foreground/15 bg-white hover:border-foreground/30"}`}
                    >
                      <button
                        type="button"
                        aria-pressed={picked}
                        onClick={() => onToggle(tile.key)}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-sm font-medium"
                      >
                        {tile.name}
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${picked ? "border-primary bg-primary text-white" : "border-foreground/25"}`}
                        >
                          {picked && <Check size={12} strokeWidth={3} aria-hidden />}
                        </span>
                      </button>
                      {picked ? (
                        <div className="relative mt-2">
                          <Input
                            inputMode="decimal"
                            aria-label={`${tile.name} per month`}
                            placeholder="No amount"
                            value={tile.amount}
                            onChange={(event) => onAmountChange(tile.key, event.target.value)}
                            className="h-9 pr-8 text-right tabular-nums"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted">
                            kr
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted">About {formatWholeKr(tile.suggested)} a month</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-foreground/10 bg-white/95 px-4 pt-4 pb-5 backdrop-blur">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm">
          <p className="text-muted">
            Planned <span className="font-semibold text-foreground tabular-nums">{formatWholeKr(summary.planned)}</span>{" "}
            of {formatWholeKr(summary.income)}
          </p>
          <p className={summary.isOver ? "font-medium text-accent" : "text-muted"}>
            {summary.isOver ? "Over by " : "Left to assign "}
            <span className="font-semibold tabular-nums">{formatWholeKr(summary.difference)}</span>
          </p>
        </div>
        <MoneyProgress
          value={summary.share}
          tone={summary.isOver ? "accent" : "success"}
          label={`${formatWholeKr(summary.planned)} of ${formatWholeKr(summary.income)} planned`}
          className="mt-2"
        />

        {error && (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <div className="flex justify-between gap-2">
            <Button variant="ghost" onClick={onBack} disabled={isSaving}>
              Back
            </Button>
            <Button variant="ghost" onClick={onSkip} disabled={isSaving}>
              Skip for now
            </Button>
          </div>
          <Button type="submit" isLoading={isSaving} className="h-11 whitespace-nowrap sm:ml-auto sm:px-6">
            {isSaving ? "Creating…" : "Create my budget"}
          </Button>
        </div>
      </div>
    </form>
  );
};
