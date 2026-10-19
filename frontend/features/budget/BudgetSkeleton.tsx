import Skeleton, { SkeletonRegion } from "@/components/ui/Skeleton";

// How many lines each category group has, so the skeleton looks like a real budget
const LINES_PER_GROUP = [3, 2, 4];

const ROW = "grid grid-cols-[2rem_minmax(0,1fr)_5rem_5rem_5rem_2.5rem] items-center gap-3 px-3";

/** Stands in for the budget table while it loads. */
export function BudgetSkeleton() {
  return (
    <SkeletonRegion>
      <div className={`${ROW} border-b border-foreground/10 py-2`}>
        <span />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="ml-auto h-3 w-12" />
        <Skeleton className="ml-auto h-3 w-12" />
        <Skeleton className="ml-auto h-3 w-12" />
        <span />
      </div>

      {LINES_PER_GROUP.map((lines, group) => (
        <div key={group}>
          <div className={`${ROW} border-b border-foreground/10 bg-foreground/[0.03] py-3`}>
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-4 w-14" />
            <Skeleton className="ml-auto h-4 w-14" />
            <Skeleton className="ml-auto h-4 w-14" />
            <span />
          </div>
          {Array.from({ length: lines }, (_, line) => (
            <div key={line} className={`${ROW} border-b border-foreground/5 py-3`}>
              <Skeleton className="size-4" />
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="ml-auto h-3.5 w-12" />
              <Skeleton className="ml-auto h-3.5 w-12" />
              <Skeleton className="ml-auto h-3.5 w-12" />
              <span />
            </div>
          ))}
        </div>
      ))}
    </SkeletonRegion>
  );
}
