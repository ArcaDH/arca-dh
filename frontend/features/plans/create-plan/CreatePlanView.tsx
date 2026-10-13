import type { FC } from "react";
import Button from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";

interface CreatePlanViewProps {
  name: string;
  error: string | null;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const CreatePlanView: FC<CreatePlanViewProps> = ({ name, error, isSaving, onNameChange, onSubmit, onClose }) => {
  return (
    <Dialog title="Create plan" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="mt-4 flex flex-col gap-4"
      >
        <div>
          <Label htmlFor="plan-name">Name</Label>
          <Input
            id="plan-name"
            autoFocus
            required
            maxLength={255}
            placeholder="e.g. Personal"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
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
            {isSaving ? "Creating…" : "Create plan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
