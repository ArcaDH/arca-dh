import type { ComponentProps } from "react";

export default function Label({ className = "", children, ...rest }: ComponentProps<"label">) {
  return (
    <label className={`mb-1 block text-xs text-foreground/60 ${className}`} {...rest}>
      {children}
    </label>
  );
}
