import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "dangerOutline";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  // Outlined in the secondary color: the same shape as primary, without the fill
  secondary: "border border-secondary bg-white text-secondary hover:bg-secondary/5 active:bg-secondary/10",
  danger: "bg-accent text-white hover:bg-accent-hover active:bg-accent-active",
  // Outlined in the accent color: the same shape as danger, without the fill
  dangerOutline: "border border-accent bg-white text-accent hover:bg-accent/5 active:bg-accent/10",
  soft: "bg-primary/10 text-primary hover:bg-primary hover:text-white",
  ghost: "text-muted hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10",
};

const sizeClasses: Record<Size, string> = {
  xs: "gap-0.5 rounded-sm px-1.5 py-0.5 text-xs",
  sm: "gap-2 rounded-lg px-3 py-1.5 text-sm",
  md: "gap-2 rounded-lg px-4 py-2 text-sm",
  lg: "h-12 gap-2 rounded-lg px-5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`inline-flex cursor-pointer items-center justify-center font-medium transition-colors disabled:cursor-default disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
