"use client";

import { ChevronRight } from "lucide-react";
import { useState, type FC } from "react";
import { formatWholeKr } from "@/lib/money";
import type { CategorySegment } from "@/lib/analytics";

interface CategoryBreakdownListProps {
  segments: CategorySegment[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  getChildren: (categoryId: string) => CategorySegment[];
}

const percentLabel = (percent: number): string => `${percent.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;

interface SegmentRowProps {
  segment: CategorySegment;
  isChild?: boolean;
}

/** The amount + percent + share bar shared by category and subcategory rows. */
const SegmentBody: FC<SegmentRowProps> = ({ segment, isChild = false }) => (
  <>
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`shrink-0 rounded-full ${isChild ? "size-2" : "size-3"}`}
        style={{ backgroundColor: segment.color }}
      />
      <span
        className={`min-w-0 flex-1 truncate ${isChild ? "text-xs text-foreground/80" : "text-sm font-medium text-foreground"}`}
      >
        {segment.name}
      </span>
      <span className={`shrink-0 tabular-nums ${isChild ? "text-xs text-foreground/80" : "text-sm text-foreground"}`}>
        {formatWholeKr(segment.spent)}
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-muted tabular-nums">{percentLabel(segment.percent)}</span>
    </span>

    <span
      className={`relative block w-full overflow-hidden rounded-full bg-foreground/10 ${isChild ? "h-1" : "h-1.5"}`}
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
        style={{ width: `${Math.min(segment.percent, 100)}%`, backgroundColor: segment.color }}
      />
    </span>
  </>
);

export const CategoryBreakdownList: FC<CategoryBreakdownListProps> = ({
  segments,
  activeCategoryId,
  onSelect,
  getChildren,
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const hasActive = activeCategoryId !== null;

  const toggle = (categoryId: string) => setExpanded((current) => ({ ...current, [categoryId]: !current[categoryId] }));

  return (
    <ul className="flex flex-col gap-1" aria-label="Spending by category">
      {segments.map((segment) => {
        const isActive = segment.categoryId === activeCategoryId;
        const dimmed = hasActive && !isActive;
        const children = getChildren(segment.categoryId);
        const hasChildren = children.length > 0;
        const isExpanded = !!expanded[segment.categoryId];

        return (
          <li key={segment.categoryId}>
            <div className={`flex items-stretch gap-1 transition-opacity ${dimmed ? "opacity-50" : ""}`}>
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={isExpanded ? `Collapse ${segment.name}` : `Expand ${segment.name}`}
                  aria-expanded={isExpanded}
                  onClick={() => toggle(segment.categoryId)}
                  className="flex w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${isExpanded ? "rotate-90" : ""} motion-reduce:transition-none`}
                    aria-hidden
                  />
                </button>
              ) : (
                <span className="w-6 shrink-0" aria-hidden />
              )}

              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(segment.categoryId)}
                className={`flex flex-1 cursor-pointer flex-col gap-1.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isActive ? "bg-foreground/5" : ""
                }`}
              >
                <SegmentBody segment={segment} />
              </button>
            </div>

            {hasChildren && isExpanded && (
              <ul className="mt-1 mb-1 ml-9 flex flex-col gap-1" aria-label={`${segment.name} subcategories`}>
                {children.map((child) => (
                  <li key={child.categoryId} className="flex flex-col gap-1.5 rounded-lg px-3 py-1.5">
                    <SegmentBody segment={child} isChild />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};
