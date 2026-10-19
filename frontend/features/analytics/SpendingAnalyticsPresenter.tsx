"use client";

import { useCallback, useMemo, useState } from "react";
import { ApiError } from "@/api/ApiClient";
import {
  toAllSubcategorySegments,
  toSpendingSegments,
  toSubcategorySegments,
  type CategorySegment,
} from "@/lib/analytics";
import { currentMonth } from "@/lib/format";
import { sumKr } from "@/lib/money";
import { useOverview } from "@/models/useOverview";
import { useCurrentPlan } from "@/models/usePlans";
import { SpendingAnalyticsView, type Grouping } from "./SpendingAnalyticsView";

export const SpendingAnalyticsPresenter = () => {
  const [month, setMonth] = useState(currentMonth);
  const [grouping, setGrouping] = useState<Grouping>("category");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [drilldownCategoryId, setDrilldownCategoryId] = useState<string | null>(null);

  const plan = useCurrentPlan();
  const overview = useOverview(plan.data?.id, month);

  const categories = overview.data?.spendingByCategory ?? null;
  const categorySegments = useMemo(() => (categories ? toSpendingSegments(categories) : null), [categories]);
  const subcategorySegments = useMemo(() => (categories ? toAllSubcategorySegments(categories) : null), [categories]);

  // Resolve a category's subcategory rows on demand, shaded from the parent slice's color.
  const getChildren = useCallback(
    (categoryId: string): CategorySegment[] => {
      const category = categories?.find((entry) => entry.categoryId === categoryId);
      const parentColor = categorySegments?.find((segment) => segment.categoryId === categoryId)?.color;
      if (!category || !parentColor) return [];
      return toSubcategorySegments(category, parentColor);
    },
    [categories, categorySegments],
  );

  // When drilled into a category, the chart + list show that category's subcategories instead.
  // Drill-down only applies in the category grouping.
  const drilldown = useMemo(() => {
    if (grouping !== "category" || !drilldownCategoryId) return null;
    const name = categorySegments?.find((segment) => segment.categoryId === drilldownCategoryId)?.name ?? null;
    const children = getChildren(drilldownCategoryId);
    return { name, segments: children };
  }, [grouping, drilldownCategoryId, categorySegments, getChildren]);

  const segments = drilldown ? drilldown.segments : grouping === "subcategory" ? subcategorySegments : categorySegments;
  const total = useMemo(() => (segments ? sumKr(segments.map((segment) => segment.spent)) : 0), [segments]);

  const noPlanYet = plan.error instanceof ApiError && plan.error.status === 404;
  const errorMessage = noPlanYet
    ? "Create a budget plan first, with the plan picker in the sidebar."
    : ((plan.error ?? overview.error)?.message ?? null);
  // "Try again" is only for a failed load. Action errors, and "create a plan first", need something else.
  const retryLoad = () => {
    if (plan.error) plan.refetch();
    if (overview.error) overview.refetch();
  };

  // Clicking the same row again clears the highlight.
  const onSelect = (categoryId: string) =>
    setActiveCategoryId((current) => (current === categoryId ? null : categoryId));

  const onDrillInto = (categoryId: string) => {
    setActiveCategoryId(null);
    setDrilldownCategoryId(categoryId);
  };

  const onDrillUp = () => {
    setActiveCategoryId(null);
    setDrilldownCategoryId(null);
  };

  // Switching grouping starts fresh: no drill-down, no highlight.
  const onGroupingChange = (next: Grouping) => {
    setActiveCategoryId(null);
    setDrilldownCategoryId(null);
    setGrouping(next);
  };

  // Drill-down (and thus the expandable list) only exists in the category grouping.
  const isCategoryGrouping = grouping === "category" && !drilldown;

  return (
    <SpendingAnalyticsView
      month={month}
      grouping={grouping}
      segments={noPlanYet ? [] : segments}
      total={total}
      activeCategoryId={activeCategoryId}
      drilldownName={drilldown?.name ?? null}
      canDrill={isCategoryGrouping}
      isRefreshing={overview.isPlaceholderData}
      errorMessage={errorMessage}
      onRetry={noPlanYet || !errorMessage ? undefined : retryLoad}
      onMonthChange={(next) => {
        setActiveCategoryId(null);
        setDrilldownCategoryId(null);
        setMonth(next);
      }}
      onGroupingChange={onGroupingChange}
      onSelect={onSelect}
      onDrillInto={onDrillInto}
      onDrillUp={onDrillUp}
      getChildren={getChildren}
    />
  );
};
