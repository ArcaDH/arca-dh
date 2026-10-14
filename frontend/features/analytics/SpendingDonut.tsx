"use client";

import type { FC } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatWholeKr } from "@/lib/money";
import type { CategorySegment } from "@/lib/analytics";

interface SpendingDonutProps {
  segments: CategorySegment[];
  total: number;
  activeCategoryId: string | null;
  /** Called with the clicked slice's id. The parent decides whether that drills in or highlights. */
  onSliceClick: (categoryId: string) => void;
}

const percentLabel = (percent: number): string => `${percent.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;

interface TooltipPayloadItem {
  payload: CategorySegment;
}

const DonutTooltip: FC<{ active?: boolean; payload?: TooltipPayloadItem[] }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const segment = payload[0].payload;

  return (
    <div className="rounded-lg border border-foreground/10 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="flex items-center gap-2 font-medium text-foreground">
        <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
        {segment.name}
      </p>
      <p className="mt-0.5 font-mono text-foreground tabular-nums">
        {formatWholeKr(segment.spent)} · {percentLabel(segment.percent)}
      </p>
    </div>
  );
};

export const SpendingDonut: FC<SpendingDonutProps> = ({ segments, total, activeCategoryId, onSliceClick }) => {
  if (segments.length === 0) {
    return <div className="flex h-80 items-center justify-center text-sm text-muted">No spending to chart.</div>;
  }

  const hasActive = activeCategoryId !== null;

  return (
    <div className="relative h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="spent"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={1.5}
            stroke="none"
            isAnimationActive={false}
            onClick={(_, index) => onSliceClick(segments[index].categoryId)}
          >
            {segments.map((segment) => {
              const dimmed = hasActive && segment.categoryId !== activeCategoryId;
              return (
                <Cell
                  key={segment.categoryId}
                  fill={segment.color}
                  fillOpacity={dimmed ? 0.3 : 1}
                  className="cursor-pointer transition-opacity focus:outline-none"
                />
              );
            })}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted">Total spent</span>
        <span className="font-mono text-xl font-semibold text-foreground tabular-nums">{formatWholeKr(total)}</span>
      </div>
    </div>
  );
};
