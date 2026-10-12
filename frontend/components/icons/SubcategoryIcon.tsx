import type { FC, SVGProps } from "react";

export const SubcategoryIcon: FC<SVGProps<SVGSVGElement> & { size?: number }> = ({ size = 16, ...rest }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M6 3v7a4 4 0 0 0 4 4h4" />
      <circle cx="17.5" cy="14" r="3.5" fill="currentColor" fillOpacity={0.18} />
      <path d="M17.5 12.6v2.8" />
    </svg>
  );
};
