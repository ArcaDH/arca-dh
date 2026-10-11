import type { ComponentProps } from "react";

export default function Card({ className = "", children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={`rounded-xl border border-foreground/10 bg-white p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
