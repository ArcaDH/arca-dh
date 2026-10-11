import { Pencil, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/Dialog";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/input";
import type { Plan } from "@/types/plan";

interface ManagePlansViewProps {
  plans: Plan[];
  editing: { planId: string; name: string } | null;
  deletingId: string | null;
  isSaving: boolean;
  error: string | null;
  onStartEdit: (plan: Plan) => void;
  onEditName: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAskDelete: (planId: string) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onClose: () => void;
}

export default function ManagePlansView(props: ManagePlansViewProps) {
  const { plans, editing, deletingId, isSaving } = props;

  return (
    <Dialog title="Manage plans" onClose={props.onClose}>
      {plans.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">You don&apos;t have any plans yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {plans.map((plan) => (
            <li key={plan.id} className="flex min-h-12 items-center gap-2 border-t border-foreground/10 py-2">
              {editing?.planId === plan.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    props.onSaveEdit();
                  }}
                  className="flex flex-1 items-center gap-2"
                >
                  <Input
                    autoFocus
                    onFocus={(event) => event.target.select()}
                    required
                    maxLength={255}
                    aria-label="Plan name"
                    value={editing.name}
                    onChange={(event) => props.onEditName(event.target.value)}
                  />
                  <Button variant="ghost" size="sm" onClick={props.onCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isLoading={isSaving}>
                    Save
                  </Button>
                </form>
              ) : deletingId === plan.id ? (
                <>
                  <p className="min-w-0 flex-1 text-sm">
                    Delete <span className="font-medium">{plan.name}</span> and everything in it?
                  </p>
                  <Button variant="ghost" size="sm" onClick={props.onCancelDelete}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" isLoading={isSaving} onClick={props.onConfirmDelete}>
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm">{plan.name}</span>
                  {plan.current && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Current</span>
                  )}
                  <IconButton aria-label={`Rename ${plan.name}`} onClick={() => props.onStartEdit(plan)}>
                    <Pencil size={15} aria-hidden />
                  </IconButton>
                  <IconButton aria-label={`Delete ${plan.name}`} onClick={() => props.onAskDelete(plan.id)}>
                    <Trash2 size={15} aria-hidden />
                  </IconButton>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {props.error && (
        <p role="alert" className="mt-3 text-sm text-accent">
          {props.error}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button variant="ghost" size="sm" onClick={props.onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
