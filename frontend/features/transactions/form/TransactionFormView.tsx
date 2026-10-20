import { CirclePlus } from "lucide-react";
import type { ReactNode } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconTile from "@/components/ui/IconTile";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import Select from "@/components/ui/select";
import { Switch } from "@/components/ui/Switch";
import type { Tag } from "@/types/tag";
import type { ForGroup, MoneyDirection } from "@/types/transaction";

export type FormState = {
  amount: string;
  direction: MoneyDirection;
  date: string;
  description: string;
  forId: string; // a subcategory, category or goal id from the "For" list
  tagIds: string[];
  repeat: boolean; // repeat every month
  repeatDay: string; // the day of the month it repeats on, empty = the day of the date
};

const DIRECTIONS: { value: MoneyDirection; label: string }[] = [
  { value: "out", label: "− Money out" },
  { value: "in", label: "+ Money in" },
];

interface TransactionFormViewProps {
  form: FormState;
  groups: ForGroup[];
  /** The tag picker, which has its own Presenter. */
  tagPicker: ReactNode;
  /** Only an expense with money out can repeat monthly. */
  canRepeat: boolean;
  /** The day it would repeat on: the one typed, or the date's day. Null when what was typed isn't a day. */
  repeatDay: number | null;
  /** The sentence under the day field: what will happen, or what to fix. */
  repeatHint: string;
  error: string | null;
  isSaving: boolean;
  onChange: (changes: Partial<FormState>) => void;
  /** The tag the user asked to delete and has not confirmed yet. */
  pendingDeleteTag: Tag | null;
  onConfirmDeleteTag: () => void;
  onCancelDeleteTag: () => void;
  onSubmit: () => void;
}

export default function TransactionFormView(props: TransactionFormViewProps) {
  const { form, groups, tagPicker, canRepeat, repeatDay, repeatHint, error, isSaving, pendingDeleteTag, onChange } =
    props;

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
        noValidate
      >
        <Card className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-foreground/60">
                <span aria-hidden className="size-2 rounded-full bg-primary" />
                Log a transaction
              </p>
              <h2 className="font-heading text-xl font-semibold">New transaction</h2>
            </div>
            <IconTile className="bg-primary/10 text-primary">
              <CirclePlus size={17} />
            </IconTile>
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <div
              role="group"
              aria-label="Money out or money in"
              className="mb-2 inline-flex overflow-hidden rounded-lg border border-foreground/20 text-xs"
            >
              {DIRECTIONS.map((direction) => (
                <button
                  key={direction.value}
                  type="button"
                  onClick={() => onChange({ direction: direction.value })}
                  aria-pressed={form.direction === direction.value}
                  className={`cursor-pointer px-3 py-1.5 transition-colors ${
                    form.direction === direction.value
                      ? "bg-primary text-white"
                      : "text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  {direction.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={(event) => onChange({ amount: event.target.value })}
                className="pr-9"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-foreground/50">
                kr
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) => onChange({ date: event.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              maxLength={500}
              placeholder="e.g. Farmers market"
              value={form.description}
              onChange={(event) => onChange({ description: event.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="for">For</Label>
            <Select
              id="for"
              value={form.forId}
              onChange={(event) => onChange({ forId: event.target.value })}
              className={`[&_option]:text-foreground ${form.forId ? "" : "text-foreground/40"}`}
            >
              <option value="" disabled hidden>
                Choose…
              </option>
              {groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            {groups.length === 0 && (
              <p className="mt-1 text-xs text-foreground/60">
                Add categories to your budget plan to log a transaction.
              </p>
            )}
          </div>

          {canRepeat && (
            <div className="flex flex-col gap-2">
              <Switch label="Repeat monthly" checked={form.repeat} onChange={(repeat) => onChange({ repeat })} />
              {form.repeat && (
                <div>
                  <Label htmlFor="repeat-day">Day of the month</Label>
                  <div className="w-24">
                    <Input
                      id="repeat-day"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder={repeatDay === null ? "1-31" : String(repeatDay)}
                      value={form.repeatDay}
                      onChange={(event) => onChange({ repeatDay: event.target.value })}
                    />
                  </div>
                  <p className="mt-1 text-xs text-foreground/60">{repeatHint}</p>
                </div>
              )}
            </div>
          )}

          {tagPicker}

          {error && (
            <p role="alert" className="text-sm text-accent">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isSaving} disabled={groups.length === 0} className="w-full">
            {isSaving ? "Saving…" : "Add transaction"}
          </Button>
        </Card>
      </form>

      {pendingDeleteTag && (
        <ConfirmDialog
          title={`Delete the tag "${pendingDeleteTag.name}"?`}
          onCancel={props.onCancelDeleteTag}
          actions={[{ label: "Delete", danger: true, onClick: props.onConfirmDeleteTag }]}
        >
          It is removed from every transaction that has it. The transactions themselves are kept.
        </ConfirmDialog>
      )}
    </>
  );
}
