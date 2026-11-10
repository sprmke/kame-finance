"use client";

import Link from "next/link";
import type { Route } from "next";
import { MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";

import { formatShortDate } from "@/components/calendar/DateNumeral";
import { Amount } from "@/components/shared/Amount";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";

import { soaPeriodCardSubtitle, soaPeriodCardTitle } from "../lib/soa-utils";
import type { SoaPeriodRow } from "./SoaPeriodTable";
import { SoaPeriodTypeBadge } from "./SoaPeriodTypeBadge";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type SoaPeriodListProps = {
  periods: SoaPeriodRow[];
  onRerun: (period: SoaPeriodRow) => void;
  onEdit: (periodId: string) => void;
  onDelete: (periodId: string) => void;
};

/** Statement months as tear-off calendar pages, grouped by year. */
export function SoaPeriodList({ periods, onRerun, onEdit, onDelete }: SoaPeriodListProps) {
  const years = new Map<number, SoaPeriodRow[]>();
  for (const period of periods) {
    const list = years.get(period.toYear) ?? [];
    list.push(period);
    years.set(period.toYear, list);
  }
  const ordered = [...years.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div className="space-y-6">
      {ordered.map(([year, rows]) => (
        <section key={year} aria-labelledby={`stmt-year-${year}`} className="space-y-2">
          <h2 id={`stmt-year-${year}`} className="font-numeral px-1 text-lg">
            {year}
          </h2>
          <ul className="divide-y rounded-lg border bg-card">
            {rows.map((period) => (
              <PeriodRow
                key={period.id}
                period={period}
                onRerun={onRerun}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PeriodRow({
  period,
  onRerun,
  onEdit,
  onDelete,
}: {
  period: SoaPeriodRow;
  onRerun: (period: SoaPeriodRow) => void;
  onEdit: (periodId: string) => void;
  onDelete: (periodId: string) => void;
}) {
  const title = soaPeriodCardTitle(period);
  const subtitle = soaPeriodCardSubtitle(period);
  const isRange = period.mode === "range";
  const channels = [
    period.notifyTelegram ? "Telegram" : null,
    period.notifySlack ? "Slack" : null,
    period.createCalendar ? "Calendar" : null,
  ].filter(Boolean);
  const href = ROUTES.dashboard.statementPeriod(period.id) as Route;

  return (
    <li className="group relative flex items-center gap-3 px-3 py-3 transition-colors duration-120 hover:bg-muted/40 sm:gap-4 sm:px-4">
      <div
        aria-hidden
        className="flex h-14 w-12 shrink-0 flex-col overflow-hidden rounded-sm border bg-card text-center"
      >
        <span className="font-numeral bg-foreground py-0.5 text-2xs leading-4 text-background">
          {period.fromYear}
        </span>
        <span
          className={cn(
            "font-headline flex flex-1 items-center justify-center uppercase leading-none",
            isRange ? "text-2xs" : "text-base",
          )}
        >
          {isRange
            ? `${MONTH_SHORT[period.fromMonth - 1]}–${MONTH_SHORT[period.toMonth - 1]}`
            : MONTH_SHORT[period.fromMonth - 1]}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="block truncate font-bold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
        >
          {title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>
            {period.cardCount} card{period.cardCount === 1 ? "" : "s"}
          </span>
          {subtitle ? <span>· {subtitle}</span> : null}
          {channels.length ? <span className="hidden sm:inline">· {channels.join(", ")}</span> : null}
          <SoaPeriodTypeBadge mode={period.mode} withinRangeLabel={period.withinRangeLabel} />
        </p>
      </div>

      <div className="shrink-0 text-right">
        <Amount value={period.totalDue} size="md" />
        <p className="mt-1 text-xs text-muted-foreground">
          {period.nextDueYmd ? `Next due ${formatShortDate(period.nextDueYmd)}` : period.totalDue > 0 ? "Outstanding" : "All paid"}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative z-10 shrink-0 max-lg:h-10 max-lg:w-10"
            aria-label={`Actions for ${title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onRerun(period)}>
            <Play />
            Re-run
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(period.id)}>
            <Pencil />
            Edit settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onDelete(period.id)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
