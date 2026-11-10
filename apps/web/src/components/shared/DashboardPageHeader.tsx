import { type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface DashboardPageHeaderProps {
  title: ReactNode;
  /** Optional one-liner under the title (≤ 12 words — minimal copy rule). */
  description?: string;
  /** Breadcrumb or back link shown above the title. */
  breadcrumb?: ReactNode;
  /** Figures or tags under the title (FigureLine, status tags). */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Page title block: headline, optional breadcrumb, figures, and the page's actions. */
export function DashboardPageHeader({
  title,
  description,
  breadcrumb,
  meta,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      {breadcrumb ? <div className="min-w-0">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="break-words">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-13 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex min-w-0 shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {meta ? <div className="min-w-0">{meta}</div> : null}
    </header>
  );
}
