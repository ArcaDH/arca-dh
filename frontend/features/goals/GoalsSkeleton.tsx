import Skeleton, { SkeletonRegion } from "@/components/ui/Skeleton";

const CARDS = 3;

/** Stands in for the goal cards while they load. Same grid and card shape as the real ones. */
export function GoalsSkeleton() {
  return (
    <SkeletonRegion className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {Array.from({ length: CARDS }, (_, card) => (
        <div key={card} className="flex flex-col rounded-xl border border-foreground/10 bg-white p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-[18px]" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-2 ml-[26px] h-3 w-20" />

          <div className="my-4 flex justify-center">
            <Skeleton className="size-[132px] rounded-full" />
          </div>

          <div className="mt-auto grid grid-cols-2 border-t border-foreground/10 pt-3">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex flex-col items-end space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}
