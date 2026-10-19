"use client";

import ErrorState from "@/components/ui/ErrorState";

// Shown by Next.js when a page crashes while it renders. "Try again" re-renders the page.
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="pt-6">
      <ErrorState message="Something went wrong on this page." onRetry={reset} />
    </div>
  );
}
