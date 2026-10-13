import type { ComponentProps, FC } from "react";

type MenuItemProps = ComponentProps<"button"> & { danger?: boolean };

// One item in a Dropdown menu
export const MenuItem: FC<MenuItemProps> = ({ danger = false, className = "", children, ...rest }) => {
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
};
