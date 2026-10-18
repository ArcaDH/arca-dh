"use client";

import { Landmark } from "lucide-react";
import { useEffect, useState, type FC } from "react";

export type ProgressTone = "primary" | "secondary" | "success" | "accent";

const toneText: Record<ProgressTone, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  success: "text-success",
  accent: "text-accent",
};

const toneFill: Record<ProgressTone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  accent: "bg-accent",
};

interface MoneyProgressProps {
  value: number;
  tone: ProgressTone;
  label: string;
  className?: string;
}

// Progress bar: lighter while filling, solid once full, with a bank at the end that lights up then
export const MoneyProgress: FC<MoneyProgressProps> = ({ value, tone, label, className = "" }) => {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
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
          className={`absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full ${toneFill[tone]} ${percent < 100 ? "opacity-60" : ""} ${motion}`}
          style={{ width: `${shown}%` }}
        />
      </div>
      <span className={percent >= 100 ? toneText[tone] : "text-foreground/30"}>
        <Landmark size={12} />
      </span>
    </div>
  );
};
