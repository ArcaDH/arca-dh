import { PageHeader } from "@/components/PageHeader";
import Card from "@/components/ui/card";
import Skeleton, { SkeletonRegion } from "@/components/ui/Skeleton";

// Shown by Next.js while another page of the app is on its way. It is generic on purpose:
// each page then shows its own skeleton while its data loads.
export default function Loading() {
  return (
    <div>
      <PageHeader>
        <Skeleton className="h-6 w-40" />
      </PageHeader>
      <Card>
        <SkeletonRegion className="space-y-4">
          {Array.from({ length: 5 }, (_, row) => (
            <Skeleton key={row} className="h-5 w-full" />
          ))}
        </SkeletonRegion>
      </Card>
    </div>
  );
}
