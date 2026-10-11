"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Button from "@/components/ui/button";

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
  const latestOnCancel = useRef(onCancel);

  useEffect(() => {
    latestOnCancel.current = onCancel;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") latestOnCancel.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-heading text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-foreground/70">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button autoFocus variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.danger ? "danger" : "primary"}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
