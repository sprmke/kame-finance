"use client";

import { useMemo } from "react";

import {
  dayMark,
  monthGrid,
  type CalendarEvent,
} from "@/lib/calendar/month-grid";
import { cn } from "@/lib/utils/cn";

import { DayMark, DayMarkGlyph } from "./DayMark";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type MonthCalendarProps = {
  year: number;
  month: number;
  todayYmd: string;
  events: CalendarEvent[];
  selectedYmd?: string | null;
  onSelectDay?: (ymd: string | null) => void;
  className?: string;
};

/**
 * The kitchen wall calendar: ruled cells, red Sundays, today as a filled
 * square, each due date circled (or checked off) with card-color ticks.
 */
export function MonthCalendar({
  year,
  month,
  todayYmd,
  events,
  selectedYmd,
  onSelectDay,
  className,
}: MonthCalendarProps) {
  const weeks = useMemo(() => monthGrid(year, month), [year, month]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.ymd) ?? [];
      list.push(event);
      map.set(event.ymd, list);
    }
    return map;
  }, [events]);

  return (
    <div className={cn("select-none", className)}>
      <div role="grid" aria-label="Month calendar" className="w-full">
        <div role="row" className="grid grid-cols-7 border-b">
          {WEEKDAY_LETTERS.map((letter, index) => (
            <div
              key={`${letter}-${index}`}
              role="columnheader"
              aria-label={WEEKDAY_NAMES[index]}
              className={cn(
                "pb-2 text-center text-xs font-bold",
                index === 0 ? "text-due" : "text-muted-foreground",
              )}
            >
              {letter}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div role="row" key={week[0]!.ymd} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((cell) => {
              const dayEvents = cell.inMonth ? (eventsByDay.get(cell.ymd) ?? []) : [];
              const dues = dayEvents.filter((event) => event.kind === "due");
              const statements = dayEvents.filter((event) => event.kind === "statement");
              const isToday = cell.ymd === todayYmd;
              const mark = isToday && dues.length === 0 ? "today" : dayMark(dayEvents);
              const selected = selectedYmd === cell.ymd;
              const interactive = Boolean(onSelectDay) && cell.inMonth && dayEvents.length > 0;
              const label = describeDay(cell.ymd, dues, statements, isToday);

              const content = (
                <>
                  <span className="flex h-9 items-start justify-center pt-1.5 sm:h-11 sm:justify-start sm:pl-2">
                    <DayMark
                      kind={mark}
                      className={cn(
                        "size-7 sm:size-8",
                        isToday && mark !== "today" && "rounded-sm ring-2 ring-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "font-numeral text-base leading-none sm:text-xl",
                          !cell.inMonth && "text-muted-foreground/40",
                          cell.inMonth && cell.weekday === 0 && mark !== "today" && "text-due",
                        )}
                      >
                        {cell.day}
                      </span>
                    </DayMark>
                  </span>
                  {dayEvents.length > 0 ? (
                    <span className="flex min-h-2 flex-wrap justify-center gap-[3px] px-1 pb-1.5 sm:justify-start sm:pl-2">
                      {dues.slice(0, 4).map((event) => (
                        <span
                          key={event.id}
                          className="h-1.5 w-2.5 rounded-[1px] ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: event.color ?? "hsl(var(--foreground))" }}
                          title={event.label}
                        />
                      ))}
                      {statements.slice(0, 4).map((event) => (
                        <span
                          key={event.id}
                          className="h-1.5 w-2.5 rounded-[1px] border bg-transparent"
                          style={{ borderColor: event.color ?? "hsl(var(--foreground))" }}
                          title={`${event.label} statement`}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className="block min-h-2 pb-1.5" />
                  )}
                </>
              );

              return (
                <div
                  role="gridcell"
                  key={cell.ymd}
                  aria-selected={selected || undefined}
                  className={cn(
                    "min-w-0 border-r last:border-r-0",
                    !cell.inMonth && "bg-muted/40",
                  )}
                >
                  {interactive ? (
                    <button
                      type="button"
                      aria-label={label}
                      aria-pressed={selected}
                      onClick={() => onSelectDay?.(selected ? null : cell.ymd)}
                      className={cn(
                        "block w-full text-left outline-none transition-colors duration-120 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        selected && "bg-accent hover:bg-accent",
                      )}
                    >
                      {content}
                    </button>
                  ) : (
                    <div aria-label={label}>{content}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function describeDay(
  ymd: string,
  dues: CalendarEvent[],
  statements: CalendarEvent[],
  isToday: boolean,
): string {
  const parts = [ymd];
  if (isToday) parts.push("today");
  if (dues.length) parts.push(`${dues.length} due: ${dues.map((d) => d.label).join(", ")}`);
  if (statements.length)
    parts.push(`statement: ${statements.map((s) => s.label).join(", ")}`);
  return parts.join(" · ");
}

export function MonthCalendarLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <li className="flex items-center gap-1.5">
        <span className="h-1.5 w-2.5 rounded-[1px] bg-foreground" aria-hidden />
        Due
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-1.5 w-2.5 rounded-[1px] border border-foreground" aria-hidden />
        Statement
      </li>
      <li className="flex items-center gap-1.5">
        <DayMarkGlyph kind="urgent" className="text-due" /> Due soon
      </li>
      <li className="flex items-center gap-1.5">
        <DayMarkGlyph kind="paid" className="text-success" /> Paid
      </li>
    </ul>
  );
}
