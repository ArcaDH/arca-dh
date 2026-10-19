import type { FC } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";

interface BasicsStepViewProps {
  planName: string;
  income: string;
  canContinue: boolean;
  error: string | null;
  onPlanNameChange: (name: string) => void;
  onIncomeChange: (income: string) => void;
  onContinue: () => void;
}

export const BasicsStepView: FC<BasicsStepViewProps> = ({
  planName,
  income,
  canContinue,
  error,
  onPlanNameChange,
  onIncomeChange,
  onContinue,
}) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      className="flex flex-col gap-5"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Let&apos;s set up your budget</h1>
        <p className="mt-1 text-sm text-muted">Two quick steps, and you can change everything later.</p>
      </div>

      <div>
        <Label htmlFor="onboarding-plan">What should we call your budget?</Label>
        <Input
          id="onboarding-plan"
          className="h-12"
          required
          maxLength={255}
          placeholder="My budget"
          value={planName}
          onChange={(event) => onPlanNameChange(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="onboarding-income">How much do you get each month, after tax?</Label>
        <div className="relative">
          <Input
            id="onboarding-income"
            className="h-12 pr-10 tabular-nums"
            inputMode="decimal"
            required
            autoFocus
            placeholder="18 500"
            value={income}
            onChange={(event) => onIncomeChange(event.target.value)}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">
            kr
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted">You can add more income sources later.</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}

      <Button type="submit" disabled={!canContinue} className="mt-2 h-12 sm:self-end sm:px-8">
        Continue
      </Button>
    </form>
  );
};
