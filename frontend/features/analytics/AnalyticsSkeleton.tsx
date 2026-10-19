import Card from "@/components/ui/card";
import Skeleton, { SkeletonRegion } from "@/components/ui/Skeleton";

const LIST_ROWS = 6;

/** Stands in for the spending chart card while it loads. */
export function AnalyticsSkeleton() {
  return (
    <Card>
      <SkeletonRegion>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-56 rounded-lg" />
        </div>

        <div className="grid items-center gap-6 md:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="flex justify-center">
            <Skeleton className="size-64 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: LIST_ROWS }, (_, row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="size-3 rounded-full" />
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </SkeletonRegion>
    </Card>
  );
}
