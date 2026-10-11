import type { ComponentProps } from "react";

const baseClasses =
  "w-full rounded-lg border border-foreground/20 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-foreground/5";

export default function Input({ className = "", ...rest }: ComponentProps<"input">) {
  return <input className={`${baseClasses} ${className}`} {...rest} />;
}
