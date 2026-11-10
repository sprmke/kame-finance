"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";

import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

import {
  canShiftOverviewPeriod,
  isCurrentOverviewPeriod,
  jumpToCurrentOverviewPeriod,
  shiftOverviewPeriod,
  withOverviewGrain,
  type OverviewPeriod,
  type OverviewPeriodGrain,
} from "../lib/overview-period";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const GRAIN_OPTIONS = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

type MonthHeaderProps = {
  period: OverviewPeriod;
  onChange: (period: OverviewPeriod) => void;
  onRunSoa: () => void;
  runSoaPending?: boolean;
};

/** The calendar's printed header: ‹ NOVEMBER 2026 › with Month/Year and Run SOA. */
export function MonthHeader({
  period,
  onChange,
  onRunSoa,
  runSoaPending,
}: MonthHeaderProps) {
  const grainNoun = period.grain === "year" ? "year" : "month";
  const canGoPrev = canShiftOverviewPeriod(period, "prev");
  const canGoNext = canShiftOverviewPeriod(period, "next");
  const atCurrent = isCurrentOverviewPeriod(period);
  const monthName = MONTH_NAMES[period.month - 1] ?? "";

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 h-11 w-11 shrink-0"
          disabled={!canGoPrev}
          onClick={() => onChange(shiftOverviewPeriod(period, "prev"))}
          aria-label={`Previous ${grainNoun}`}
        >
          <ChevronLeft className="!size-5" />
        </Button>
        <h1
          className="flex min-w-0 flex-1 items-baseline gap-2 sm:flex-none"
          aria-live="polite"
        >
          {period.grain === "month" ? (
            <>
              <span className="font-headline truncate text-2xl uppercase leading-none tracking-[-0.01em] sm:text-3xl">
                {monthName}
              </span>
              <span className="font-numeral text-xl leading-none text-muted-foreground sm:text-2xl">
                {period.year}
              </span>
            </>
          ) : (
            <span className="font-numeral text-2xl leading-none sm:text-3xl">
              {period.year}
            </span>
          )}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          disabled={!canGoNext}
          onClick={() => onChange(shiftOverviewPeriod(period, "next"))}
          aria-label={`Next ${grainNoun}`}
        >
          <ChevronRight className="!size-5" />
        </Button>
        {atCurrent ? null : (
          <Button
            variant="link"
            size="sm"
            className={cn("ml-1 hidden h-auto sm:inline-flex")}
            onClick={() => onChange(jumpToCurrentOverviewPeriod(period.grain))}
          >
            {period.grain === "year" ? "This year" : "This month"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <SegmentedControl
          ariaLabel="View by"
          value={period.grain}
          onChange={(grain) =>
            onChange(withOverviewGrain(period, grain as OverviewPeriodGrain))
          }
          options={GRAIN_OPTIONS}
          className="flex-1 sm:flex-none"
        />
        <Button
          onClick={onRunSoa}
          loading={runSoaPending}
          className="max-lg:h-10"
        >
          <Play />
          Run SOA
        </Button>
      </div>
      {atCurrent ? null : (
        <Button
          variant="link"
          size="sm"
          className="-mt-2 h-auto self-start sm:hidden"
          onClick={() => onChange(jumpToCurrentOverviewPeriod(period.grain))}
        >
          {period.grain === "year" ? "Back to this year" : "Back to this month"}
        </Button>
      )}
    </header>
  );
}
