import type { LucideIcon } from "lucide-react";
import type { CSSProperties, FC, ReactNode } from "react";

export type BadgeTone = "primary" | "secondary" | "success" | "accent";

const solid: Record<BadgeTone, string> = {
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  success: "bg-success text-white",
  accent: "bg-accent text-white",
};

const soft: Record<BadgeTone, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/10 text-accent",
};

const sparkColor: Record<BadgeTone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  accent: "bg-accent",
};

const SPARKS = [
  [-26, -14],
  [-18, 14],
  [0, -18],
  [20, -14],
  [28, 10],
  [6, 16],
];

interface StatusBadgeProps {
  tone: BadgeTone;
  variant?: "solid" | "soft";
  icon?: LucideIcon;
  celebrate?: boolean;
  children: ReactNode;
}

export const StatusBadge: FC<StatusBadgeProps> = ({
  tone,
  variant = "solid",
  icon: Icon,
  celebrate = false,
  children,
}) => {
  const look = variant === "solid" ? `text-xs font-semibold ${solid[tone]}` : `tabular-nums ${soft[tone]}`;

  return (
    <span className="relative inline-flex">
      {celebrate &&
        SPARKS.map(([x, y]) => (
          <span
            key={`${x},${y}`}
            aria-hidden
            style={{ "--spark-x": `${x}px`, "--spark-y": `${y}px` } as CSSProperties}
            className={`absolute top-1/2 left-1/2 -mt-0.75 -ml-0.75 size-1.5 rounded-full opacity-0 motion-safe:animate-[badge-spark_700ms_ease-out_150ms] ${sparkColor[tone]}`}
          />
        ))}
      <span
        className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 ${look} ${
          celebrate ? "motion-safe:animate-[badge-pop_450ms_ease-out]" : ""
        }`}
      >
        {Icon && <Icon size={13} strokeWidth={3} aria-hidden />}
        {children}
      </span>
    </span>
  );
};
