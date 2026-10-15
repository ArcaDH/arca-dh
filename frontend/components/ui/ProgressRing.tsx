"use client";

import { useEffect, useState, type FC, type ReactNode } from "react";

interface ProgressRingProps {
  value: number;
  size: number;
  thickness: number;
  color: string;
  label: string;
  children?: ReactNode;
}

// The progress ring for the saving goals cards
export const ProgressRing: FC<ProgressRingProps> = ({ value, size, thickness, color, label, children }) => {
  const share = Math.min(Math.max(value, 0), 1);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(share));
    return () => cancelAnimationFrame(frame);
  }, [share]);

  const radius = (size - thickness) / 2;
  const length = 2 * Math.PI * radius;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(share * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-foreground/[0.06]"
        />
        {share > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - shown)}
            className={`${color} transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};
