import type { FC, ReactNode } from "react";

interface PageHeaderProps {
  children: ReactNode;
  aside?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ children, aside }) => {
  return (
    <header className="-mx-8 -mt-6 mb-6 flex h-16 items-center justify-between gap-6 border-b border-foreground/10 px-8">
      <div className="flex min-w-0 items-center gap-4">{children}</div>
      {aside && <div className="flex shrink-0 items-center">{aside}</div>}
    </header>
  );
};
