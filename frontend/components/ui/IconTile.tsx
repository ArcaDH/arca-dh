import type { ReactNode } from "react";

interface IconTileProps {
  children: ReactNode;
  /** The colors of the tile, for example "bg-primary/10 text-primary". */
  className?: string;
}

/** A small rounded square with an icon in it, for the corner of a card. Decorative, so it is hidden from screen readers. */
export default function IconTile({ children, className = "" }: IconTileProps) {
  return (
    <span aria-hidden className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${className}`}>
      {children}
    </span>
  );
}
