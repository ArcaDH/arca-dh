"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/Dialog";

type DialogAction = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  actions: DialogAction[];
  onCancel: () => void;
}

/** A popup that asks the user to confirm. Cancel is focused first, and Escape or a click outside cancels. */
export default function ConfirmDialog({ title, children, actions, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={onCancel} role="alertdialog">
      <div className="mt-2 text-sm text-foreground/70">{children}</div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button autoFocus variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {actions.map((action) => (
          <Button key={action.label} variant={action.danger ? "danger" : "primary"} size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
      </div>
    </Dialog>
  );
}
