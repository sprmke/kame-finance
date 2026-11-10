import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type DashboardSectionProps = {
  title: ReactNode;
  /** Small figure or count after the title. */
  count?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function DashboardSection({
  title,
  count,
  action,
  children,
  className,
  id,
}: DashboardSectionProps) {
  return (
    <section id={id} className={cn("space-y-3", className)}>
      <div className="flex min-h-9 items-center justify-between gap-4">
        <h2 className="flex items-baseline gap-2">
          {title}
          {count !== undefined && count !== null ? (
            <span className="font-numeral text-sm text-muted-foreground">{count}</span>
          ) : null}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
