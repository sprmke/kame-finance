"use client";

import type { ReactNode } from "react";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

import {
  canShiftOverviewPeriod,
  formatOverviewPeriodLabel,
  isCurrentOverviewPeriod,
  jumpToCurrentOverviewPeriod,
  shiftOverviewPeriod,
  withOverviewGrain,
  type OverviewPeriod,
  type OverviewPeriodGrain,
} from "../lib/overview-period";

type OverviewPeriodSwitcherProps = {
  period: OverviewPeriod;
  onChange: (period: OverviewPeriod) => void;
  className?: string;
};

const GRAIN_OPTIONS: { value: OverviewPeriodGrain; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export function OverviewPeriodSwitcher({
  period,
  onChange,
  className,
}: OverviewPeriodSwitcherProps) {
  const label = formatOverviewPeriodLabel(period);
  const grainNoun = period.grain === "year" ? "year" : "month";
  const canGoPrev = canShiftOverviewPeriod(period, "prev");
  const canGoNext = canShiftOverviewPeriod(period, "next");
  const atCurrent = isCurrentOverviewPeriod(period);

  return (
    <div
      role="group"
      aria-label="Statement period"
      className={cn(
        "inline-flex h-11 max-w-full items-stretch sm:h-9",
        className,
      )}
    >
      <PeriodStepButton
        label={`Previous ${grainNoun}`}
        disabled={!canGoPrev}
        className="hidden rounded-l-lg sm:inline-flex"
        onClick={() => onChange(shiftOverviewPeriod(period, "prev"))}
      >
        <ChevronLeft aria-hidden />
      </PeriodStepButton>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground sm:min-h-9 sm:min-w-[9.5rem] sm:flex-none sm:rounded-none sm:border-x-0 sm:px-3",
            "transition-colors duration-200 hover:bg-accent hover:text-accent-foreground",
            "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "data-[state=open]:bg-accent",
            "motion-reduce:transition-none",
          )}
          aria-label={`${label}. Choose month or year`}
        >
          <CalendarDays
            className="hidden size-4 shrink-0 text-muted-foreground sm:block"
            aria-hidden
          />
          <span className="truncate">{label}</span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground motion-reduce:transition-none"
            aria-hidden
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="min-h-11 sm:hidden"
            disabled={!canGoPrev}
            onSelect={() => onChange(shiftOverviewPeriod(period, "prev"))}
          >
            Previous {grainNoun}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11 sm:hidden"
            disabled={!canGoNext}
            onSelect={() => onChange(shiftOverviewPeriod(period, "next"))}
          >
            Next {grainNoun}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuLabel>View by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={period.grain}
            onValueChange={(value) =>
              onChange(withOverviewGrain(period, value as OverviewPeriodGrain))
            }
          >
            {GRAIN_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="min-h-11"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {atCurrent ? null : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-11"
                onSelect={() =>
                  onChange(jumpToCurrentOverviewPeriod(period.grain))
                }
              >
                {period.grain === "year" ? "This year" : "This month"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PeriodStepButton
        label={`Next ${grainNoun}`}
        disabled={!canGoNext}
        className="hidden rounded-r-lg sm:inline-flex"
        onClick={() => onChange(shiftOverviewPeriod(period, "next"))}
      >
        <ChevronRight aria-hidden />
      </PeriodStepButton>
    </div>
  );
}

function PeriodStepButton({
  label,
  disabled,
  className,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex w-11 shrink-0 items-center justify-center border border-input bg-background text-muted-foreground sm:w-9",
        "transition-colors duration-200 hover:bg-accent hover:text-accent-foreground",
        "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        "active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        "touch-manipulation [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </button>
  );
}
