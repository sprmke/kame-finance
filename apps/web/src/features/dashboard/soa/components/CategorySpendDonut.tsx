"use client";

import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils/cn";
import { formatPhpAmount } from "@/lib/utils/format-money";
import { CANNOT_ANALYZE_SLUG } from "@/lib/transactions/categories";

import { categoryChartColor } from "../lib/category-chart-styles";
import type { CategorySpendRow } from "../lib/category-analytics";

type DonutSlice = {
  name: string;
  value: number;
  slug: string;
  color: string;
};

type HoverState = {
  slice: DonutSlice;
  x: number;
  y: number;
};

function buildDonutSlices(rows: CategorySpendRow[]): DonutSlice[] {
  const top = rows.slice(0, 6);
  const restTotal = rows.slice(6).reduce((sum, row) => sum + row.total, 0);

  const slices: DonutSlice[] = top.map((row, index) => ({
    name: row.label,
    value: row.total,
    slug: row.slug,
    color: categoryChartColor(row.slug, index),
  }));

  if (restTotal > 0) {
    slices.push({
      name: "Other",
      value: restTotal,
      slug: "other",
      color: categoryChartColor("other", slices.length),
    });
  }

  return slices;
}

type CategorySpendDonutProps = {
  rows: CategorySpendRow[];
  spendTotal: number;
  selectedSlug?: string | null;
  onSelectCategory?: (slug: string) => void;
};

function DonutSliceTooltip({
  hover,
  spendTotal,
}: {
  hover: HoverState;
  spendTotal: number;
}) {
  const pct =
    spendTotal > 0
      ? Math.round((hover.slice.value / spendTotal) * 1000) / 10
      : 0;

  return (
    <div
      className="pointer-events-none absolute z-10 w-max max-w-[min(100%,12rem)]"
      style={{
        left: hover.x,
        top: hover.y,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <div className="rounded-lg border border-border/80 bg-card px-3 py-2 shadow-elevated">
        <p className="text-sm font-medium">{hover.slice.name}</p>
        <p className="text-sm tabular-nums text-foreground">
          {formatPhpAmount(hover.slice.value)}
        </p>
        <p className="text-xs text-muted-foreground">{pct}% of spend</p>
      </div>
    </div>
  );
}

export function CategorySpendDonut({
  rows,
  spendTotal,
  selectedSlug = null,
  onSelectCategory,
}: CategorySpendDonutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slices = buildDonutSlices(rows);
  const [hover, setHover] = useState<HoverState | null>(null);
  const animationKey = slices
    .map((slice) => `${slice.slug}:${Math.round(slice.value)}`)
    .join("|");
  const selectedSlice =
    slices.find((slice) => slice.slug === selectedSlug) ?? null;
  const centerValue = selectedSlice?.value ?? spendTotal;
  const selectedInChart = Boolean(selectedSlice);

  function updateHover(slice: DonutSlice | undefined, event: ReactMouseEvent) {
    if (!slice || !containerRef.current) {
      setHover(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    setHover({
      slice,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  if (!slices.length) {
    return (
      <p className="flex h-full min-h-[14rem] items-center justify-center text-sm text-muted-foreground">
        No categorized spend yet.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto h-64 w-full max-w-xs transition-opacity duration-700 ease-out sm:h-72",
        onSelectCategory && "[&_.recharts-pie-sector]:cursor-pointer",
      )}
    >
      {hover ? (
        <DonutSliceTooltip hover={hover} spendTotal={spendTotal} />
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            key={animationKey}
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="hsl(var(--background))"
            strokeWidth={2}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
            onMouseEnter={(data, index, event) => {
              updateHover(slices[index], event);
            }}
            onMouseMove={(_, index, event) => {
              updateHover(slices[index], event);
            }}
            onMouseLeave={() => {
              setHover(null);
            }}
            onClick={(_, index) => {
              const slice = slices[index];
              if (!slice || slice.slug === "other") return;
              onSelectCategory?.(slice.slug);
            }}
          >
            {slices.map((slice) => {
              const isSelected = selectedSlug === slice.slug;
              const dimmed = selectedInChart
                ? !isSelected
                : Boolean(hover && hover.slice.name !== slice.name);
              return (
                <Cell
                  key={slice.name}
                  fill={slice.color}
                  opacity={dimmed ? 0.35 : 1}
                  className="transition-opacity duration-150"
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <span className="max-w-[9rem] truncate text-[11px] uppercase tracking-wide text-muted-foreground">
          {selectedSlice?.name ?? "Total"}
        </span>
        <span
          key={`${animationKey}:${selectedSlug ?? "all"}`}
          className="font-display text-xl font-bold tabular-nums tracking-tight motion-safe:animate-fade-in sm:text-2xl"
        >
          {formatPhpAmount(centerValue)}
        </span>
      </div>
    </div>
  );
}

export function CategorySpendLegend({
  rows,
  selectedSlug = null,
  onSelectCategory,
}: {
  rows: CategorySpendRow[];
  selectedSlug?: string | null;
  onSelectCategory?: (slug: string) => void;
}) {
  const slices = buildDonutSlices(rows).filter(
    (slice) => slice.slug !== CANNOT_ANALYZE_SLUG,
  );

  if (!slices.length) return null;

  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-2">
      {slices.map((slice) => {
        const isOther = slice.slug === "other";
        const isSelected = selectedSlug === slice.slug;
        const interactive = Boolean(onSelectCategory) && !isOther;

        const content = (
          <>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="max-w-[8rem] truncate">{slice.name}</span>
          </>
        );

        return (
          <li key={slice.name}>
            {interactive ? (
              <button
                type="button"
                onClick={() => onSelectCategory?.(slice.slug)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-xs",
                  "text-muted-foreground transition-colors duration-150",
                  "hover:bg-muted/60 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected && "bg-muted text-foreground",
                )}
              >
                {content}
              </button>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
                  isSelected && "text-foreground",
                )}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
