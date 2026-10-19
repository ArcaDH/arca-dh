import type { ComponentProps } from "react";

/**
 * A grey pulsing block that stands in for content that is still loading.
 * Give it the size and shape of the real thing with `className`, for example "h-4 w-32" or "size-9 rounded-lg".
 * It is rounded a little by default. The `:where` keeps that default weaker than any `rounded-*` you pass.
 */
export default function Skeleton({ className = "", ...rest }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={`bg-foreground/10 [:where(&)]:rounded-md motion-safe:animate-pulse ${className}`}
      {...rest}
    />
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
