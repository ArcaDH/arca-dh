"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface DropdownProps {
  /** What the button shows. */
  trigger: ReactNode;
  /** Accessible name for the button, needed when the trigger is only an icon. */
  label?: string;
  triggerClassName?: string;
  /** The menu. Call close() after an item is chosen. */
  children: (close: () => void) => ReactNode;
}

/** A button that opens a menu below it. A click outside or Escape closes the menu. */
export default function Dropdown({ trigger, label, triggerClassName = "", children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen((open) => !open)}
        className={`cursor-pointer ${triggerClassName}`}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 z-40 mt-1 w-60 rounded-xl border border-foreground/10 bg-white p-1 shadow-lg"
        >
          {children(() => setIsOpen(false))}
        </div>
      )}
    </div>
  );
}
