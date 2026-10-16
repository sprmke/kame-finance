"use client";

import type { RefObject } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatPhpAmount } from "@/lib/utils/format-money";

type CategoryDrillDownHeaderProps = {
  label: string;
  count: number;
  total: number;
  spendTotal: number;
  accentColor: string;
  onBack: () => void;
  backButtonRef?: RefObject<HTMLButtonElement | null>;
  className?: string;
};

export function CategoryDrillDownHeader({
  label,
  count,
  total,
  spendTotal,
  accentColor,
  onBack,
  backButtonRef,
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
      <div className="flex flex-col gap-3 p-3 pl-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 sm:pl-5">
        <div className="flex min-w-0 items-start gap-1 sm:items-center">
          <Button
            ref={backButtonRef}
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 shrink-0 gap-1.5 px-2.5 -ml-1"
            onClick={onBack}
            aria-label="Back to category breakdown"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <div className="min-w-0 flex-1 pt-0.5 sm:pt-0">
            <h3
              id="category-drill-title"
              className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold leading-tight tracking-tight text-foreground"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                style={{ backgroundColor: accentColor }}
                aria-hidden
              />
              <span className="truncate">{label}</span>
            </h3>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {countLabel}
              {sharePct > 0 ? (
                <>
                  <span aria-hidden> · </span>
                  <span>{sharePct}% of period spend</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 pl-10 sm:pl-0">
          <p className="font-display text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
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
