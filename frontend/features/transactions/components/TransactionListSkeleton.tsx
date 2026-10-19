import Skeleton, { SkeletonRegion } from "@/components/ui/Skeleton";

// The same number of rows as the first page of the real list
const ROWS = 5;

/** Stands in for the transaction rows while they load. Same row shape as TransactionList. */
export default function TransactionListSkeleton() {
  return (
    <SkeletonRegion>
      {Array.from({ length: ROWS }, (_, row) => (
        <div key={row} className="flex items-center gap-3 border-t border-foreground/10 py-3">
          <Skeleton className="w-[3px] self-stretch rounded-full" />
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </SkeletonRegion>
  );
}
