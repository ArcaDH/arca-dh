"use client";

import { useEffect, useState, type FC } from "react";

export type ProgressTone = "success" | "secondary" | "accent" | "primary";

const toneText: Record<ProgressTone, string> = {
  success: "text-success",
  secondary: "text-secondary",
  accent: "text-accent",
  primary: "text-primary",
};

const toneFill: Record<ProgressTone, string> = {
  success: "bg-success",
  secondary: "bg-secondary",
  accent: "bg-accent",
  primary: "bg-primary",
};

// A small bank: roof, columns, base
function Bank() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 6 8 2.5 14 6Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 7.5v5M8 7.5v5M12 7.5v5" strokeLinecap="round" />
      <path d="M2 14h12" strokeLinecap="round" />
    </svg>
  );
}

interface MoneyProgressProps {
  // From 0 to 1
  value: number;
  tone: ProgressTone;
  label: string;
  className?: string;
}

// Progress bar with a bank at the end that lights up when the budget is used up
export const MoneyProgress: FC<MoneyProgressProps> = ({ value, tone, label, className = "" }) => {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  // Start at 0 and move to the real value after the first paint, so the bar visibly fills
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  const motion = "transition-[width] duration-700 ease-out motion-reduce:transition-none";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`flex items-center gap-1.5 ${className}`}
    >
      <div className="relative h-2 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-foreground/10" />
        <div
          className={`absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full ${toneFill[tone]} ${motion}`}
          style={{ width: `${shown}%` }}
        />
      </div>
      <span className={percent >= 100 ? toneText[tone] : "text-foreground/30"}>
        <Bank />
      </span>
    </div>
  );
};
