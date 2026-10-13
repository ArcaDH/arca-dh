import type { FC } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/input";
import { formatWholeKr } from "@/lib/money";
import type { IncomeSource } from "@/types/incomeSource";
import type { IncomeForm } from "@/types/budget";

interface IncomeSourcesViewProps {
  sources: IncomeSource[] | null;
  total: number;
  editing: ({ id: string } & IncomeForm) | null;
  newSource: IncomeForm;
  isSaving: boolean;
  error: string | null;
  onStartEdit: (source: IncomeSource) => void;
  onEditChange: (changes: Partial<IncomeForm>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (source: IncomeSource) => void;
  onNewChange: (changes: Partial<IncomeForm>) => void;
  onAdd: () => void;
  onClose: () => void;
}

// used for adding and editing the income source(s)
function IncomeFields(props: {
  form: IncomeForm;
  onChange: (changes: Partial<IncomeForm>) => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <Input
          autoFocus={props.autoFocus}
          aria-label="Income name"
          placeholder="e.g. Salary"
          maxLength={255}
          value={props.form.name}
          onChange={(event) => props.onChange({ name: event.target.value })}
        />
      </div>
      <div className="w-32 shrink-0">
        <Input
          aria-label="Amount per month"
          inputMode="decimal"
          placeholder="kr / month"
          value={props.form.amount}
          onChange={(event) => props.onChange({ amount: event.target.value })}
          className="tabular-nums"
        />
      </div>
    </>
  );
}

// Plans monthly income
export const IncomeSourcesView: FC<IncomeSourcesViewProps> = ({
  sources,
  total,
  editing,
  newSource,
  isSaving,
  error,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onNewChange,
  onAdd,
  onClose,
}) => {
  return (
    <Dialog title="Monthly income" onClose={onClose}>
      <p className="mt-1 text-sm text-muted">This is the money you allocate to your categories each month.</p>

      <ul className="mt-4 flex flex-col">
        {sources?.map((source) => (
          <li key={source.id} className="flex min-h-12 items-center gap-2 border-t border-foreground/10 py-2">
            {editing?.id === source.id ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSaveEdit();
                }}
                className="flex flex-1 items-center gap-2"
              >
                <IncomeFields form={editing} onChange={onEditChange} autoFocus />
                <Button type="submit" size="sm" isLoading={isSaving}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </form>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-sm">{source.name}</span>
                <span className="text-sm font-medium tabular-nums">{formatWholeKr(Number(source.monthlyAmount))}</span>
                <IconButton aria-label={`Edit ${source.name}`} onClick={() => onStartEdit(source)}>
                  <Pencil size={15} aria-hidden />
                </IconButton>
                <IconButton aria-label={`Delete ${source.name}`} onClick={() => onDelete(source)}>
                  <Trash2 size={15} aria-hidden />
                </IconButton>
              </>
            )}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onAdd();
        }}
        className="flex items-center gap-2 border-t border-foreground/10 pt-3"
      >
        <IncomeFields form={newSource} onChange={onNewChange} autoFocus={sources?.length === 0} />
        <IconButton
          type="submit"
          aria-label="Add income"
          className="shrink-0 bg-primary text-white hover:bg-primary-hover hover:text-white"
        >
          <Plus size={18} aria-hidden />
        </IconButton>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-accent">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm">
          Total <span className="font-semibold tabular-nums">{formatWholeKr(total)}</span>
          <span className="text-muted"> / month</span>
        </p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
};
