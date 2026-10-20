"use client";

import { useEffect, useRef, type ReactNode, type FC } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  role?: "dialog" | "alertdialog";
}

export const Dialog: FC<DialogProps> = ({ title, children, onClose, role = "dialog" }) => {
  const latestOnClose = useRef(onClose);

  useEffect(() => {
    latestOnClose.current = onClose;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") latestOnClose.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div
        role={role}
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title" className="font-heading text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
};
