import type { ComponentProps } from "react";

type MenuItemProps = ComponentProps<"button"> & { danger?: boolean };

/** One choice in a Dropdown menu. Pass role="menuitemradio" and aria-checked for items that show a selection. */
export default function MenuItem({ danger = false, className = "", children, ...rest }: MenuItemProps) {
  const color = danger
    ? "text-accent hover:bg-accent/10"
    : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground";

  return (
    <button
      type="button"
      role="menuitem"
      className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${color} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
