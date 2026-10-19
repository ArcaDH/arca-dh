import type { FC } from "react";
import Button from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import type { BudgetItemForm } from "@/types/budget";

interface BudgetItemFormViewProps {
  title: string;
  // Show the optional monthly target field (subcategory forms only).
  showTarget?: boolean;
  form: BudgetItemForm;
  error: string | null;
  isSaving: boolean;
  onChange: (changes: Partial<BudgetItemForm>) => void;
  onSubmit: () => void;
  onClose: () => void;
}

// Create or rename popup: categories get a name, subcategories also an optional monthly target
export const BudgetItemFormView: FC<BudgetItemFormViewProps> = ({
  title,
  showTarget,
  form,
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
          <Label htmlFor="budget-item-name">Name</Label>
          <Input
            id="budget-item-name"
            autoFocus
            maxLength={255}
            placeholder="e.g. Food"
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>

        {showTarget && (
          <div>
            <Label htmlFor="budget-item-target">Monthly target (optional)</Label>
            <div className="relative">
              <Input
                id="budget-item-target"
                inputMode="decimal"
                placeholder="No target"
                value={form.target}
                onChange={(event) => onChange({ target: event.target.value })}
                className="pr-9 tabular-nums"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-foreground/50">
                kr
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              What you aim to fund each month. You can assign money to it later. Leave blank for no target.
            </p>
          </div>
        )}

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
