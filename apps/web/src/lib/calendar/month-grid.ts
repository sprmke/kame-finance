import type { DayMarkKind } from "@/components/calendar/DayMark";
import type { BillState } from "@/lib/due/bill-state";

export type CalendarEvent = {
  id: string;
  ymd: string;
  kind: "due" | "statement";
  color: string | null;
  label: string;
  mark: DayMarkKind;
  state?: BillState;
};

const MARK_PRIORITY: Record<DayMarkKind, number> = {
  urgent: 6,
  due: 5,
  missing: 4,
  expected: 3,
  paid: 2,
  today: 1,
  none: 0,
};

export function ymdOf(year: number, month: number, day: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const clamped = Math.min(Math.max(1, day), last);
  return `${year}-${String(month).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

/** The strongest mark among a day's due events. */
export function dayMark(events: CalendarEvent[]): DayMarkKind {
  let best: DayMarkKind = "none";
  for (const event of events) {
    if (event.kind !== "due") continue;
    if (MARK_PRIORITY[event.mark] > MARK_PRIORITY[best]) best = event.mark;
  }
  return best;
}

export type MonthGridCell = {
  ymd: string;
  day: number;
  inMonth: boolean;
  weekday: number;
};

/** Sunday-first weeks covering the month (5 or 6 rows). */
export function monthGrid(year: number, month: number): MonthGridCell[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastCellOffset = first.getUTCDay() + daysInMonth;
  const weeks = Math.ceil(lastCellOffset / 7);

  const rows: MonthGridCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: MonthGridCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + w * 7 + d);
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      row.push({
        ymd: ymdOf(y, m, day),
        day,
        inMonth: y === year && m === month,
        weekday: d,
      });
    }
    rows.push(row);
  }
  return rows;
}

/** Calendar mark for a bill state (see DESIGN.md › Shapes). */
export function markForState(state: BillState): DayMarkKind {
  switch (state) {
    case "paid":
      return "paid";
    case "overdue":
    case "due-soon":
      return "urgent";
    case "missing":
      return "missing";
    case "expected":
      return "expected";
    default:
      return "due";
  }
}
