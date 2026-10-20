import type { FC, ReactNode } from "react";

interface PageHeaderProps {
  children?: ReactNode;
  aside?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ children, aside }) => {
  return (
    <header className="-mx-4 -mt-4 mb-4 flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-foreground/10 px-4 py-3 md:-mx-8 md:-mt-6 md:mb-6 md:px-8">
      <div className="flex min-w-0 items-center gap-4">{children}</div>
      {aside && <div className="flex max-w-full min-w-0 items-center md:shrink-0">{aside}</div>}
    </header>
  );
};
