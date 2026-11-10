import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** Label/value rows with a dotted leader — replaces stat-card strips (DESIGN.md › Ledger). */
export function Ledger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={cn("flex flex-col", className)}>{children}</dl>;
}

export function LedgerRow({
  label,
  value,
  hint,
  emphasis = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3 py-2", className)}>
      <dt
        className={cn(
          "shrink-0 text-13",
          emphasis ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {hint ? (
          <span className="ml-1.5 text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </dt>
      <span aria-hidden className="leader h-px min-w-4 flex-1 self-center" />
      <dd className="shrink-0 text-right">{value}</dd>
    </div>
  );
}

/**
 * One-line figure strip for page headers: "₱42,180 due · ₱18,900 paid · 3/5 cards".
 * Each item is a figure plus a short label; separators are thin rules.
 */
export function FigureLine({
  items,
  className,
}: {
  items: Array<{ key: string; figure: ReactNode; label: ReactNode }>;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "flex flex-wrap items-stretch gap-x-5 gap-y-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.key}
          className={cn(
            "flex min-w-0 flex-col gap-1",
            index > 0 && "sm:border-l sm:pl-5",
          )}
        >
          <dd className="order-1">{item.figure}</dd>
          <dt className="order-2 text-xs font-medium text-muted-foreground">
            {item.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
