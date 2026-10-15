import type { FC } from "react";
import Button from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog } from "@/components/ui/Dialog";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import { Switch } from "@/components/ui/Switch";
import type { GoalForm } from "@/types/goal";

function KrInput(props: { id: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Input
        id={props.id}
        inputMode="decimal"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="pr-9 tabular-nums"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-foreground/50">
        kr
      </span>
    </div>
  );
}

interface GoalFormViewProps {
  title: string;
  form: GoalForm;
  minDeadline: string;
  hint: string | null;
  error: string | null;
  isSaving: boolean;
  onChange: (changes: Partial<GoalForm>) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const GoalFormView: FC<GoalFormViewProps> = ({
  title,
  form,
  minDeadline,
  hint,
  error,
  isSaving,
  onChange,
  onSubmit,
  onClose,
}) => {
  return (
    <Dialog title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="mt-4 flex flex-col gap-4"
        noValidate
      >
        <div>
          <Label htmlFor="goal-name">Name</Label>
          <Input
            id="goal-name"
            autoFocus
            maxLength={255}
            placeholder="e.g. Trip to Japan"
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="goal-target">Target</Label>
          <KrInput
            id="goal-target"
            placeholder="30000"
            value={form.target}
            onChange={(target) => onChange({ target })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Switch
            label="Reach it by a date"
            checked={form.hasDeadline}
            onChange={(hasDeadline) => onChange({ hasDeadline })}
          />
          {form.hasDeadline && (
            <DatePicker
              label="Reach it by"
              value={form.deadline}
              min={minDeadline}
              onChange={(deadline) => onChange({ deadline })}
            />
          )}
        </div>

        <div>
          <Label htmlFor="goal-monthly">Monthly</Label>
          <KrInput
            id="goal-monthly"
            placeholder={form.hasDeadline ? "Pick a date first" : "2500"}
            value={form.monthly}
            onChange={(monthly) => onChange({ monthly })}
          />
          {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
        </div>

        {error && (
          <p role="alert" className="text-sm text-accent">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
