import { type ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 border-l border-primary pl-3">
        <h1 className="break-words font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="min-w-0 sm:max-w-[70%] sm:shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}
