"use client";

import { useEffect, useRef, useState, type ReactNode, type FC } from "react";

interface DropdownProps {
  trigger: ReactNode;
  label?: string;
  triggerClassName?: string;
  align?: "start" | "end";
  children: (close: () => void) => ReactNode;
}

export const Dropdown: FC<DropdownProps> = ({ trigger, label, triggerClassName = "", align = "start", children }) => {
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
          className={`absolute top-full z-40 mt-1 w-max max-w-96 min-w-60 rounded-xl border border-foreground/10 bg-white p-1 shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setIsOpen(false))}
        </div>
      )}
    </div>
  );
};
