import type { ComponentProps } from "react";

/**
 * A grey pulsing block that stands in for content that is still loading.
 * Give it the size and shape of the real thing with `className`, for example "h-4 w-32" or "size-9 rounded-lg".
 */
export default function Skeleton({ className = "", ...rest }: ComponentProps<"div">) {
  const rounding = className.includes("rounded") ? "" : "rounded-md";

  return (
    <div aria-hidden className={`bg-foreground/10 motion-safe:animate-pulse ${rounding} ${className}`} {...rest} />
  );
}

/** Wraps a group of skeletons so screen readers hear "Loading…" once instead of nothing. */
export function SkeletonRegion({ className = "", children, ...rest }: ComponentProps<"div">) {
  return (
    <div role="status" aria-busy="true" className={className} {...rest}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}
