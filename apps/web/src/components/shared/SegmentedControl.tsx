"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import {
  segmentedToggleButtonClass,
  segmentedToggleRootClass,
} from "./segmented-toggle-styles";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel: string;
  className?: string;
  /** Hide labels below `sm` when icons are present. */
  compact?: boolean;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  compact = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(segmentedToggleRootClass, className)}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={compact && Icon ? option.label : undefined}
            onClick={() => onChange(option.value)}
            className={cn(segmentedToggleButtonClass(active), "flex-1 sm:flex-none")}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
            <span className={cn(compact && Icon && "hidden sm:inline")}>
              {option.label}
            </span>
            {option.count !== undefined ? (
              <span
                className={cn(
                  "font-numeral text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
