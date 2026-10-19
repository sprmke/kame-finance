"use client";

import { cn } from "@/lib/utils/cn";
import { formatPhpAmount } from "@/lib/utils/format-money";

type CategoryDrillDownHeaderProps = {
  label: string;
  count: number;
  total: number;
  spendTotal: number;
  accentColor: string;
  className?: string;
};

export function CategoryDrillDownHeader({
  label,
  count,
  total,
  spendTotal,
  accentColor,
  className,
}: CategoryDrillDownHeaderProps) {
  const sharePct =
    spendTotal > 0 ? Math.round((total / spendTotal) * 1000) / 10 : 0;
  const countLabel = `${count} ${count === 1 ? "transaction" : "transactions"}`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/70 bg-muted/25",
        className,
      )}
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accentColor }}
        aria-hidden
      />
      <div className="flex flex-col gap-2 p-3 pl-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-3.5 sm:pl-5">
        <div className="min-w-0">
          <h3
            id="category-drill-title"
            className="flex min-w-0 items-center gap-2 font-display text-base font-semibold leading-tight tracking-tight text-foreground"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </h3>
          <p className="mt-0.5 pl-4 text-xs tabular-nums text-muted-foreground">
            {countLabel}
            {sharePct > 0 ? (
              <>
                <span aria-hidden> · </span>
                <span>{sharePct}% of period spend</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="font-display text-lg font-semibold tabular-nums leading-none text-foreground">
            {formatPhpAmount(total)}
          </p>
          {sharePct > 0 ? (
            <div
              className="h-1.5 w-full min-w-[8rem] max-w-[10rem] overflow-hidden rounded-full bg-muted/60"
              role="presentation"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.min(Math.max(sharePct, 4), 100)}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
