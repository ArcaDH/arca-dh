import type { FC } from "react";
import Skeleton, { SkeletonRegion } from "@/components/ui/Skeleton";

const NAV_ITEMS = 4;
const ROWS = 6;

// The app's frame (sidebar, page header, content) while it isn't known yet whether to show the page
export const AppSkeleton: FC = () => {
  return (
    <SkeletonRegion className="flex flex-1 flex-row">
      <div className="flex w-64 shrink-0 flex-col border-r border-foreground/10">
        <div className="flex h-16 items-center border-b border-foreground/10 pl-5">
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="border-b border-foreground/10 px-3 py-3">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: NAV_ITEMS }, (_, item) => (
            <Skeleton key={item} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="-mx-8 -mt-6 mb-6 flex h-16 items-center border-b border-foreground/10 px-8">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: ROWS }, (_, row) => (
            <Skeleton key={row} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
};
