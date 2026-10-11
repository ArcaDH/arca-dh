import type { ComponentProps } from "react";

// An icon has no text, so screen readers need an aria-label: it is required here
type IconButtonProps = Omit<ComponentProps<"button">, "aria-label"> & { "aria-label": string };

export default function IconButton({ className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-lg p-1.5 text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
