import { ChevronRight } from "lucide-react";
import type { FC } from "react";
import { PageHeader } from "@/components/PageHeader";
import Card from "@/components/ui/card";
import ErrorState from "@/components/ui/ErrorState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import type { CategorySegment } from "@/lib/analytics";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";
import { CategoryBreakdownList } from "./CategoryBreakdownList";
import { SpendingDonut } from "./SpendingDonut";

export type Grouping = "category" | "subcategory";

interface SpendingAnalyticsViewProps {
  month: string;
  grouping: Grouping;
  segments: CategorySegment[] | null;
  total: number;
  activeCategoryId: string | null;
  drilldownName: string | null;
  canDrill: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  // Set when the failure is a load that can be tried again
  onRetry?: () => void;
  onMonthChange: (month: string) => void;
  onGroupingChange: (grouping: Grouping) => void;
  onSelect: (categoryId: string) => void;
  /** Drill the chart into a category. */
  onDrillInto: (categoryId: string) => void;
  /** Return to the top (category) level. */
  onDrillUp: () => void;
  /** Resolves a category's subcategory segments on demand, for the expandable list rows. */
  getChildren: (categoryId: string) => CategorySegment[];
}

const GROUPINGS: { value: Grouping; label: string }[] = [
  { value: "category", label: "Categories" },
  { value: "subcategory", label: "Subcategories" },
];

const GroupingToggle: FC<{ grouping: Grouping; onChange: (grouping: Grouping) => void }> = ({ grouping, onChange }) => (
  <div role="group" aria-label="Group spending by" className="flex rounded-lg bg-foreground/5 p-0.5 text-sm">
    {GROUPINGS.map(({ value, label }) => {
      const isActive = value === grouping;
      return (
        <button
          key={value}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(value)}
          className={`cursor-pointer rounded-md px-3 py-1 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            isActive ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          {label}
        </button>
      );
    })}
  </div>
);

export const SpendingAnalyticsView: FC<SpendingAnalyticsViewProps> = ({
  month,
  grouping,
  segments,
  total,
  activeCategoryId,
  drilldownName,
  canDrill,
  isRefreshing,
  errorMessage,
  onRetry,
  onMonthChange,
  onGroupingChange,
  onSelect,
  onDrillInto,
  onDrillUp,
  getChildren,
}) => {
  const isDrilledIn = drilldownName !== null;
  const noChildren = () => [];

  return (
    <div>
      <PageHeader>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Overview</h1>
        <MonthPicker month={month} onChange={onMonthChange} />
      </PageHeader>

      {errorMessage && <ErrorState message={errorMessage} onRetry={onRetry} />}

      {!segments ? (
        !errorMessage && <AnalyticsSkeleton />
      ) : segments.length === 0 ? (
        !errorMessage && (
          <Card>
            <p className="py-8 text-center text-sm text-muted">No spending recorded this month.</p>
          </Card>
        )
      ) : (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Chart level" className="flex items-center gap-1 text-sm">
              {isDrilledIn ? (
                <>
                  <button
                    type="button"
                    onClick={onDrillUp}
                    className="cursor-pointer rounded-md px-1.5 py-0.5 font-medium text-link transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    All categories
                  </button>
                  <ChevronRight size={14} className="text-muted" aria-hidden />
                  <span aria-current="page" className="font-heading font-semibold text-foreground">
                    {drilldownName}
                  </span>
                </>
              ) : (
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Spending by {grouping === "subcategory" ? "subcategory" : "category"}
                </h2>
              )}
            </nav>

            <GroupingToggle grouping={grouping} onChange={onGroupingChange} />
          </div>

          <div
            className={`grid items-center gap-6 transition-opacity md:grid-cols-[20rem_minmax(0,1fr)] ${
              isRefreshing ? "opacity-60" : ""
            }`}
          >
            <SpendingDonut
              segments={segments}
              total={total}
              activeCategoryId={activeCategoryId}
              onSliceClick={canDrill ? onDrillInto : onSelect}
            />
            <CategoryBreakdownList
              segments={segments}
              activeCategoryId={activeCategoryId}
              onSelect={onSelect}
              getChildren={canDrill ? getChildren : noChildren}
            />
          </div>

          {canDrill && <p className="mt-4 text-center text-xs text-muted">Click a slice to drill into a category.</p>}
        </Card>
      )}
    </div>
  );
};
